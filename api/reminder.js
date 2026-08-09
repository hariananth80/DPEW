// Hit by the external cron pinger at 2:30 PM, 5:30 PM and 7:30 PM Bangkok
// time. Sends nothing if everything's already done.
// GET /api/reminder?secret=...
const { runCheck } = require('../lib/dpew');

module.exports = async (req, res) => {
  if (req.query.secret !== process.env.WEBAPP_SECRET) {
    return res.status(200).json({ ok: false, error: 'unauthorized' });
  }
  try {
    const result = await runCheck(false);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: false, error: err.message });
  }
};
