// Safe connectivity check — no Airtable/Telegram calls.
// GET /api/ping?secret=...
module.exports = async (req, res) => {
  if (req.query.secret !== process.env.WEBAPP_SECRET) {
    return res.status(200).json({ ok: false, error: 'unauthorized' });
  }
  return res.status(200).json({ ok: true, pong: true, version: 'vercel-v1' });
};
