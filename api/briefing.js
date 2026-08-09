// Hit by the external cron pinger at 8:30 AM Bangkok time.
// GET /api/briefing?secret=...
const { sendMorningBriefing } = require('../lib/dpew');

module.exports = async (req, res) => {
  if (req.query.secret !== process.env.WEBAPP_SECRET) {
    return res.status(200).json({ ok: false, error: 'unauthorized' });
  }
  try {
    const sent = await sendMorningBriefing();
    return res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: false, error: err.message });
  }
};
