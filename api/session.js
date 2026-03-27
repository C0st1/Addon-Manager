const { setSessionCookie, clearSessionCookie } = require('../lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }

  if (req.body?.logout) {
    clearSessionCookie(res);
    res.status(200).json({ ok: true });
    return;
  }

  const authKey = (req.body?.authKey || '').trim();
  if (!authKey) {
    res.status(400).json({ ok: false, error: 'authKey is required' });
    return;
  }

  setSessionCookie(res, authKey);
  res.status(200).json({ ok: true });
};
