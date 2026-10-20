'use strict';

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method tidak diizinkan.' });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    ok: true,
    platform: 'vercel',
    teraboxConfigured: Boolean((process.env.TERABOX_RESOLVER_URL || '').trim()),
    downloadMode: 'serverless-limited',
    message: 'API LinkDrop berjalan di Vercel.'
  });
};
