// Proxy for index.html's Airtable/Telegram calls — mirrors doPost() in
// checkin_protocol_fixed.gs. Keeps AIRTABLE_TOKEN/TG_TOKEN out of the
// public dashboard entirely; the page only ever holds WEBAPP_SECRET.
const { atGet, atPost, atPatchRecord, tgSend, DPEW_CHAT, HARI_CHAT } = require('../lib/dpew');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (err) { return res.status(200).json({ ok: false, error: 'bad request body' }); }
  }
  if (!body || body.secret !== process.env.WEBAPP_SECRET) {
    return res.status(200).json({ ok: false, error: 'unauthorized' });
  }

  try {
    switch (body.action) {
      case 'atGet': {
        const records = await atGet(body.tableId, body.formula, body.fields);
        return res.status(200).json({ ok: true, records });
      }
      case 'atPost': {
        const record = await atPost(body.tableId, body.fields);
        return res.status(200).json({ ok: true, record });
      }
      case 'atPatch': {
        await atPatchRecord(body.tableId, body.recordId, body.fields);
        return res.status(200).json({ ok: true });
      }
      case 'tgSend': {
        const chatId = body.chat === 'hari' ? HARI_CHAT : DPEW_CHAT;
        const sent = await tgSend(chatId, body.text);
        return res.status(200).json({ ok: sent });
      }
      default:
        return res.status(200).json({ ok: false, error: 'unknown action' });
    }
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: false, error: err.message });
  }
};
