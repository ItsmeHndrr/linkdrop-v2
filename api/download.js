'use strict';

// Vercel Functions do not include yt-dlp/FFmpeg by default, and serverless
// functions are not suitable for streaming large converted media files.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Gunakan metode POST.' });
  }

  return res.status(501).json({
    error: 'lagi tahap pengembangan ya, jadi mohon bersabar :)'
  });
};
