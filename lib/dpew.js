// ================================================================
//  MONTHSTAYZ — CHECK-IN PROTOCOL AUTOMATION (Vercel port)
//  Faithful port of checkin_protocol_fixed.gs's business logic.
//  Tokens come from environment variables, never hardcoded.
//  The Google-Sheet dashboard/menu/trigger management from the Apps
//  Script version is intentionally NOT ported — nobody actually looks
//  at that sheet; the HTML dashboard + Telegram are the real UI.
// ================================================================

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = 'appND9kP55cvkDX7V';
const TG_TOKEN        = process.env.TG_TOKEN;
const DPEW_CHAT       = -1004415576097;
const HARI_CHAT       = 2043278046;
const TZ              = 'Asia/Bangkok';

const MASTER_TBL = 'tblodAjjJy8FBQAY7';
const COMP_TBL   = 'tblK36oDEOD1SdKQj';

const MT = {
  tripId:      'fld1ziuDjSOUDfmdY',
  arrivalDate: 'fldu81bwcyq86aBKz',
  property:    'fldy6ALjM2cSz745M',
  channel:     'fldrmnsj1lsZO9UoJ',
  custName:    'fldB8I68PoBtSDWeS',
  groupName:   'fldAnwCUUCiV32DCE',
  checkoutDate:'fldiQISqiSkO45tvn',
};

const CT = {
  tripId:        'fldUNpm31vNyoNuGC',
  masterRecId:   'fld1RNQz0VasAfCtw',
  property:      'fldvrWs3pfSdNce0w',
  custName:      'fldAAib7G6qnkRJqM',
  channel:       'fldvfNM43HeNNRq81',
  arrivalDate:   'fldh8ATDYHKW9V3DQ',
  deposit:       'fldPSNu2SDgIW5SBD',
  passport:      'fldPh5ggFtwWIAd0k',
  electric:      'fldtMHMC0ylWZr0ae',
  water:         'fldXkjX7159cfKD0g',
  depositAt:     'fldX691UPBebXAhZ1',
  passportAt:    'fldMJaSSbWKVG9omE',
  electricAt:    'fldG5TthLcuYgXqEh',
  waterAt:       'fldcydcrIvDvYKgep',
  needsElectric: 'fld04aLyfyfscTcnX',
  needsWater:    'fldG7hnWqLBaDZHjp',
  depositWaived: 'fldtIg9hkHzaM06Sn',
  electricNA:    'fldkgDZ3a0EKDWoAp',
  waterNA:       'fldhijaiQ5NTUs4UU',
  completedBy:   'fldIzoPJxrHYpy8dP',
  groupName:     'fldOMNlOpUbTfoAwW',
  notes:         'fldoTudQrPX8Caz9d',
  custNoResp:    'fldKaWYKMc4y7MC1C',
  custNoRespReason: 'fld0C3vYNCf37sZUZ',
  depositRet:     'fldjoXaHMKY2nXV8X',
  elecChargeDone: 'fldKXTxKFVg8123iZ',
  waterChargeDone:'fld276er0j5Ibrpbp',
};

// ================================================================
//  DATE / TIME HELPERS
// ================================================================
function todayBangkok() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // yyyy-MM-dd
}
function displayDate() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
}
function displayTime() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: false });
}
// Short display date like "12 Jul" from yyyy-MM-dd
function fmtShortDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T00:00:00Z');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ });
  } catch (e) { return iso; }
}

// ================================================================
//  AIRTABLE API HELPERS
// ================================================================
async function atGet(tableId, filterFormula, fieldIds) {
  let url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(tableId)}?`;
  const parts = ['returnFieldsByFieldId=true'];
  if (filterFormula) parts.push('filterByFormula=' + encodeURIComponent(filterFormula));
  if (fieldIds) fieldIds.forEach(f => parts.push('fields%5B%5D=' + encodeURIComponent(f)));
  url += parts.join('&');

  let records = [];
  let offset = null;
  do {
    const fetchUrl = offset ? url + '&offset=' + offset : url;
    const res = await fetch(fetchUrl, { headers: { Authorization: 'Bearer ' + AIRTABLE_TOKEN } });
    const data = await res.json();
    if (data.error) throw new Error('Airtable GET error: ' + JSON.stringify(data.error));
    records = records.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);
  return records;
}

async function atPost(tableId, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(tableId)}?returnFieldsByFieldId=true`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + AIRTABLE_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error('Airtable POST error: ' + JSON.stringify(data.error));
  return data.records && data.records[0];
}

async function atPatchRecord(tableId, recordId, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(tableId)}/${recordId}?returnFieldsByFieldId=true`,
    {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + AIRTABLE_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error('Airtable PATCH error: ' + JSON.stringify(data.error));
  return data;
}

// ================================================================
//  TELEGRAM HELPER
// ================================================================
async function tgSend(chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  const data = await res.json();
  const recipient = chatId === DPEW_CHAT ? 'DPEW Group' : 'Hari Ananth';
  if (!data.ok) console.error('Telegram error to ' + recipient + ': ' + JSON.stringify(data));
  return !!data.ok;
}

// ================================================================
//  BUSINESS RULES
// ================================================================
function applyRules(property, channel) {
  const isBDC = (channel || '').toLowerCase().includes('booking');
  const isSNT = (property || '').toUpperCase().includes('SNT');
  return {
    needsDeposit: true,
    needsPassport: true,
    needsElectric: !isBDC,
    needsWater: !isBDC && !isSNT,
  };
}

function extractName(raw) {
  if (!raw) return '';
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string') return raw;
  return String(raw);
}

// ================================================================
//  FETCH TODAY'S TRIPS FROM MASTER TRIPS
// ================================================================
async function getTodayTrips() {
  const today = todayBangkok();
  const formula = `AND(IS_SAME({Arrival Date}, DATETIME_PARSE('${today}'), 'day'), FIND('Phuket', {City}), OR({Inquiry status} = 'Paid and confirmed', {Inquiry status} = 'Checked-In'))`;
  const fields = [MT.tripId, MT.arrivalDate, MT.property, MT.channel, MT.custName, MT.groupName];
  const records = await atGet(MASTER_TBL, formula, fields);

  return records.map(r => {
    const f = r.fields;
    const property = f[MT.property] || '';
    const channel = f[MT.channel] || '';
    const custName = extractName(f[MT.custName]);
    const rules = applyRules(property, channel);
    return {
      masterRecId: r.id,
      tripId: f[MT.tripId] || '',
      property,
      channel,
      custName,
      groupName: f[MT.groupName] || '',
      arrivalDate: today,
      ...rules,
    };
  });
}

// ================================================================
//  CHECK-OUT PROTOCOL — pending task detection
// ================================================================
function getIncompleteCheckout(cf, needsElectric, needsWater) {
  const list = [];
  if (!cf[CT.depositRet] && !cf[CT.depositWaived]) list.push('💵 Deposit Return');
  if (needsElectric && !cf[CT.elecChargeDone] && !cf[CT.electricNA]) list.push('⚡ Electricity Charges');
  if (needsWater && !cf[CT.waterChargeDone] && !cf[CT.waterNA]) list.push('💧 Water Charges');
  return list;
}

// Pending check-outs: trips whose Checkout Date is within [today-daysBack, today]
async function getPendingCheckouts(daysBack) {
  const today = todayBangkok();
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: TZ });
  const cutoff = new Date(Date.now() - (daysBack + 1) * 24 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: TZ });

  const tripFormula = `AND(IS_AFTER({Checkout Date}, DATETIME_PARSE('${cutoff}')), IS_BEFORE({Checkout Date}, DATETIME_PARSE('${tomorrow}')), FIND('Phuket', {City}), OR({Inquiry status} = 'Checked-In', {Inquiry status} = 'Trip completed'))`;
  const fields = [MT.tripId, MT.checkoutDate, MT.property, MT.channel, MT.custName, MT.groupName];
  const records = await atGet(MASTER_TBL, tripFormula, fields);
  if (!records.length) return [];

  const byMid = {};
  for (let i = 0; i < records.length; i += 40) {
    const chunk = records.slice(i, i + 40);
    const comps = await atGet(COMP_TBL, `OR(${chunk.map(r => `{Master Trip Record ID}='${r.id}'`).join(',')})`);
    comps.forEach(r => {
      const mid = r.fields[CT.masterRecId];
      if (!mid) return;
      const existing = byMid[mid];
      const hasData = r.fields[CT.property] || r.fields[CT.custName];
      if (!existing || (hasData && !(existing.fields[CT.property] || existing.fields[CT.custName]))) {
        byMid[mid] = { id: r.id, fields: r.fields };
      }
    });
  }

  const pending = [];
  records.forEach(r => {
    const comp = byMid[r.id];
    if (!comp) return;
    if (comp.fields[CT.custNoResp]) return;
    const f = r.fields;
    const rules = applyRules(f[MT.property], f[MT.channel]);
    const incomplete = getIncompleteCheckout(comp.fields, rules.needsElectric, rules.needsWater);
    if (!incomplete.length) return;
    pending.push({
      property: f[MT.property] || '',
      custName: extractName(f[MT.custName]),
      channel: f[MT.channel] || '',
      checkoutDate: f[MT.checkoutDate] || '',
      incomplete,
      note: comp.fields[CT.notes] || '',
    });
  });
  pending.sort((a, b) => (a.checkoutDate || '').localeCompare(b.checkoutDate || ''));
  return pending;
}

// ================================================================
//  FETCH OVERDUE PENDING CHECK-INS (last N days, excluding today)
// ================================================================
async function getOverduePending(daysBack) {
  const today = todayBangkok();
  const cutoff = new Date(Date.now() - (daysBack + 1) * 24 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: TZ });

  const tripFormula = `AND(IS_AFTER({Arrival Date}, DATETIME_PARSE('${cutoff}')), IS_BEFORE({Arrival Date}, DATETIME_PARSE('${today}')), FIND('Phuket', {City}), OR({Inquiry status} = 'Paid and confirmed', {Inquiry status} = 'Checked-In'))`;
  const fields = [MT.tripId, MT.arrivalDate, MT.property, MT.channel, MT.custName, MT.groupName];
  const records = await atGet(MASTER_TBL, tripFormula, fields);
  if (!records.length) return [];

  const compFormula = `AND(IS_AFTER({Arrival Date}, DATETIME_PARSE('${cutoff}')), IS_BEFORE({Arrival Date}, DATETIME_PARSE('${today}')))`;
  const comps = await atGet(COMP_TBL, compFormula);
  const byMid = {};
  comps.forEach(r => {
    const mid = r.fields[CT.masterRecId];
    if (!mid) return;
    const existing = byMid[mid];
    const hasData = r.fields[CT.property] || r.fields[CT.custName];
    if (!existing || (hasData && !(existing.fields[CT.property] || existing.fields[CT.custName]))) {
      byMid[mid] = { id: r.id, fields: r.fields };
    }
  });

  const overdue = [];
  records.forEach(r => {
    const comp = byMid[r.id];
    if (!comp) return;
    if (comp.fields[CT.custNoResp]) return;
    const f = r.fields;
    const rules = applyRules(f[MT.property], f[MT.channel]);
    const incomplete = getIncomplete(comp.fields, rules.needsElectric, rules.needsWater);
    if (!incomplete.length) return;
    overdue.push({
      property: f[MT.property] || '',
      custName: extractName(f[MT.custName]),
      channel: f[MT.channel] || '',
      arrivalDate: f[MT.arrivalDate] || '',
      incomplete,
      note: comp.fields[CT.notes] || '',
    });
  });
  overdue.sort((a, b) => (a.arrivalDate || '').localeCompare(b.arrivalDate || ''));
  return overdue;
}

// ================================================================
//  FETCH TODAY'S COMPLETION RECORDS
// ================================================================
async function getTodayCompletions() {
  const today = todayBangkok();
  const formula = `IS_SAME({Arrival Date}, DATETIME_PARSE('${today}'), 'day')`;
  const records = await atGet(COMP_TBL, formula);
  const byMid = {};
  records.forEach(r => {
    const mid = r.fields[CT.masterRecId];
    if (mid) byMid[mid] = { id: r.id, fields: r.fields };
  });
  return byMid;
}

// Create a completion record if one doesn't exist yet
async function ensureCompletion(trip, existingByMid) {
  if (existingByMid[trip.masterRecId]) return existingByMid[trip.masterRecId];
  const rec = await atPost(COMP_TBL, {
    [CT.tripId]: trip.tripId,
    [CT.masterRecId]: trip.masterRecId,
    [CT.property]: trip.property,
    [CT.custName]: trip.custName,
    [CT.channel]: trip.channel,
    [CT.arrivalDate]: trip.arrivalDate,
    [CT.needsElectric]: trip.needsElectric,
    [CT.needsWater]: trip.needsWater,
    [CT.groupName]: trip.groupName,
    [CT.deposit]: false,
    [CT.passport]: false,
    [CT.electric]: false,
    [CT.water]: false,
    [CT.depositWaived]: false,
    [CT.electricNA]: false,
    [CT.waterNA]: false,
  });
  if (rec) existingByMid[trip.masterRecId] = { id: rec.id, fields: rec.fields };
  return existingByMid[trip.masterRecId] || null;
}

// ================================================================
//  GET INCOMPLETE TASKS FOR A TRIP — needsElectric/needsWater passed in
//  fresh (from applyRules on the trip's CURRENT property+channel), never
//  read off a possibly-stale snapshot on the completion record.
// ================================================================
function getIncomplete(cf, needsElectric, needsWater) {
  const list = [];
  if (!cf[CT.deposit] && !cf[CT.depositWaived]) list.push('💵 Deposit');
  if (!cf[CT.passport]) list.push('🛂 Passport');
  if (needsElectric && !cf[CT.electric] && !cf[CT.electricNA]) list.push('⚡ Electric Meter');
  if (needsWater && !cf[CT.water] && !cf[CT.waterNA]) list.push('💧 Water Meter');
  return list;
}

// ================================================================
//  1. MORNING BRIEFING — always sends
// ================================================================
async function sendMorningBriefing() {
  const trips = await getTodayTrips();
  const completions = await getTodayCompletions();
  await Promise.all(trips.map(t => ensureCompletion(t, completions)));

  let msg = `🌅 <b>Good morning! Check-in Briefing — ${displayDate()}</b>\n\n`;

  if (!trips.length) {
    msg += '🌴 No check-ins today. Have a great day!';
  } else {
    msg += `📋 <b>${trips.length} check-in(s) today:</b>\n`;
    trips.forEach(t => {
      const tasks = ['☐ 💵 Deposit', '☐ 🛂 Passport'];
      if (t.needsElectric) tasks.push('☐ ⚡ Electric Meter');
      if (t.needsWater) tasks.push('☐ 💧 Water Meter');
      msg += `\n🏠 <b>${t.property}</b>  |  👤 ${t.custName}\n`;
      msg += `📦 ${t.channel}  |  📌 Group: ${t.groupName}\n`;
      msg += tasks.join('\n') + '\n';
    });
    msg += `\n📊 Tick off each task in the dashboard as you complete it.`;
  }

  const pendingOuts = await getPendingCheckouts(10);
  if (pendingOuts.length) {
    msg += `\n\n🧳 <b>Pending check-out tasks (last 10 days):</b>\n`;
    pendingOuts.forEach(t => {
      msg += `\n🏠 <b>${t.property}</b>  |  👤 ${t.custName}  |  🧳 Checked out: ${fmtShortDate(t.checkoutDate)}\n`;
      msg += `Pending: ${t.incomplete.join('  ·  ')}\n`;
      if (t.note) msg += `💬 Note: <i>${t.note}</i>\n`;
    });
    msg += `\n👆 Use the 🗂️ Previous Trips button in the dashboard to resolve these.`;
  }

  return tgSend(DPEW_CHAT, msg);
}

// ================================================================
//  2/3. REMINDER (plain) and ESCALATION (DPEW + Hari) — shared logic,
//  sends nothing if everything's already done.
// ================================================================
async function runCheck(isEscalation) {
  const trips = await getTodayTrips();
  const completions = await getTodayCompletions();
  const pendingTrips = [];

  trips.forEach(t => {
    const comp = completions[t.masterRecId];
    if (!comp) return;
    if (comp.fields[CT.custNoResp]) return;
    const incomplete = getIncomplete(comp.fields, t.needsElectric, t.needsWater);
    const note = comp.fields[CT.notes] || '';
    if (incomplete.length) pendingTrips.push({ ...t, incomplete, note });
  });

  const overdueTrips = isEscalation ? [] : await getOverduePending(10);
  const pendingOuts = isEscalation ? [] : await getPendingCheckouts(10);

  if (!pendingTrips.length && !overdueTrips.length && !pendingOuts.length) {
    return { sent: false, reason: 'all done' };
  }

  const time = displayTime();
  const date = displayDate();

  if (!isEscalation) {
    let msg = `⏰ <b>Reminder (${time}) — Pending Check-in Tasks</b>\n${date}\n\n`;
    if (pendingTrips.length) {
      msg += `📅 <b>Today's check-ins:</b>\n\n`;
      pendingTrips.forEach(t => {
        msg += `🏠 <b>${t.property}</b>  |  👤 ${t.custName}\n`;
        msg += `Pending: ${t.incomplete.join('  ·  ')}\n`;
        if (t.note) msg += `💬 Note: <i>${t.note}</i>\n`;
        msg += `\n`;
      });
    }
    if (overdueTrips.length) {
      msg += `⏳ <b>Overdue — check-ins from the last 10 days:</b>\n\n`;
      overdueTrips.forEach(t => {
        msg += `🏠 <b>${t.property}</b>  |  👤 ${t.custName}  |  📅 Checked in: ${fmtShortDate(t.arrivalDate)}\n`;
        msg += `Still pending: ${t.incomplete.join('  ·  ')}\n`;
        if (t.note) msg += `💬 Note: <i>${t.note}</i>\n`;
        msg += `\n`;
      });
    }
    if (pendingOuts.length) {
      msg += `🧳 <b>Check-outs — pending tasks (last 10 days):</b>\n\n`;
      pendingOuts.forEach(t => {
        msg += `🏠 <b>${t.property}</b>  |  👤 ${t.custName}  |  🧳 Checked out: ${fmtShortDate(t.checkoutDate)}\n`;
        msg += `Still pending: ${t.incomplete.join('  ·  ')}\n`;
        if (t.note) msg += `💬 Note: <i>${t.note}</i>\n`;
        msg += `\n`;
      });
    }
    msg += `👆 Please complete these now and tick them off in the dashboard (use the 🗂️ Previous Trips button for overdue items).`;
    const sent = await tgSend(DPEW_CHAT, msg);
    return { sent };
  }

  let dpewMsg = `🚨 <b>ESCALATION (${time}) — Tasks Still Incomplete!</b>\n${date}\n\n`;
  pendingTrips.forEach(t => {
    dpewMsg += `🏠 <b>${t.property}</b>  |  👤 ${t.custName}\n`;
    dpewMsg += `Missing: ${t.incomplete.join('  ·  ')}\n`;
    if (t.note) dpewMsg += `💬 Note: <i>${t.note}</i>\n`;
    dpewMsg += `\n`;
  });
  dpewMsg += `⚠️ Hari Ananth has been notified. Please act immediately.`;
  const sentDpew = await tgSend(DPEW_CHAT, dpewMsg);

  let hariMsg = `🚨 <b>Escalation Alert — Incomplete Check-in Tasks</b>\n`;
  hariMsg += `${time}  ·  ${date}\n\n`;
  hariMsg += `Hi Hari, the following check-in items are still not completed:\n\n`;
  pendingTrips.forEach(t => {
    hariMsg += `🏠 <b>${t.property}</b>  |  👤 ${t.custName}  |  ${t.channel}\n`;
    hariMsg += `Missing: ${t.incomplete.join('  ·  ')}\n`;
    hariMsg += t.note ? `💬 Reason from team: <i>${t.note}</i>\n\n` : `💬 <i>No reason provided by team</i>\n\n`;
  });
  hariMsg += `Please follow up with the reservations team immediately.`;
  const sentHari = await tgSend(HARI_CHAT, hariMsg);

  return { sent: sentDpew && sentHari };
}

module.exports = {
  DPEW_CHAT, HARI_CHAT, MASTER_TBL, COMP_TBL, MT, CT,
  atGet, atPost, atPatchRecord, tgSend,
  sendMorningBriefing, runCheck,
};
