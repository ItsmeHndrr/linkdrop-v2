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
    error: 'Fitur konversi/unduh MP4 atau MP3 berbasis yt-dlp belum tersedia di deployment Vercel ini. Vercel tidak menyertakan yt-dlp dan FFmpeg secara default. Gunakan backend terpisah yang mendukung proses media, lalu hubungkan frontend ke backend tersebut.'
  });
};
