// Hit by the external cron pinger at 7:00 PM Bangkok time.
// Sends to DPEW group AND Hari personally, only if tasks are still pending.
// GET /api/escalation?secret=...
const { runCheck } = require('../lib/dpew');

module.exports = async (req, res) => {
  if (req.query.secret !== process.env.WEBAPP_SECRET) {
    return res.status(200).json({ ok: false, error: 'unauthorized' });
  }
  try {
    const result = await runCheck(true);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: false, error: err.message });
  }
};
