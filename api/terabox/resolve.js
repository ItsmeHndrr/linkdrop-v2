'use strict';

const ALLOWED_HOSTS = new Set([
  'terabox.com', 'www.terabox.com',
  'teraboxapp.com', 'www.teraboxapp.com',
  '1024tera.com', 'www.1024tera.com',
  '1024terabox.com', 'www.1024terabox.com',
  '4funbox.com', 'www.4funbox.com',
  'teraboxlink.com', 'www.teraboxlink.com',
  'terabox.app', 'www.terabox.app',
  'freeterabox.com', 'www.freeterabox.com',
  'terasharelink.com', 'www.terasharelink.com',
  'terasharefile.com', 'www.terasharefile.com',
  'terafileshare.com', 'www.terafileshare.com',
  'teraboxshare.com', 'www.teraboxshare.com'
]);

function isTeraBox(raw) {
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) &&
      ALLOWED_HOSTS.has(url.hostname.toLowerCase()) &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

function safeFileName(name) {
  return String(name || 'terabox-file')
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
    .slice(0, 180) || 'terabox-file';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Gunakan metode POST.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const shareUrl = String(body.url || '').trim();

  if (!isTeraBox(shareUrl)) {
    return res.status(400).json({ error: 'Masukkan tautan berbagi TeraBox yang valid.' });
  }

  const resolverUrl = (process.env.TERABOX_RESOLVER_URL || '').trim();
  const apiKey = (process.env.TERABOX_API_KEY || '').trim();

  if (!resolverUrl) {
    return res.status(503).json({
      error: 'Backend TeraBox belum dikonfigurasi. Tambahkan TERABOX_RESOLVER_URL di Vercel Project Settings → Environment Variables.'
    });
  }

  let endpoint;
  try {
    endpoint = new URL(resolverUrl);
  } catch {
    return res.status(500).json({ error: 'TERABOX_RESOLVER_URL bukan URL yang valid.' });
  }

  if (endpoint.protocol !== 'https:' &&
      !['localhost', '127.0.0.1'].includes(endpoint.hostname)) {
    return res.status(500).json({ error: 'Resolver eksternal harus menggunakan HTTPS.' });
  }

  try {
    endpoint.searchParams.set('url', shareUrl);
    const headers = { accept: 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const upstream = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(20000)
    });

    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); }
    catch { data = { message: 'Resolver mengembalikan respons yang bukan JSON.' }; }

    if (!upstream.ok) {
      return res.status(502).json({
        error: `Resolver TeraBox merespons HTTP ${upstream.status}.`,
        detail: data.error || data.message || 'Periksa konfigurasi resolver.'
      });
    }

    const files = Array.isArray(data) ? data :
      (data.files || data.list || data.data?.files || data.data?.list ||
       (data.data ? [data.data] : []));

    const normalized = files.map((file, index) => ({
      id: String(file.id ?? file.fs_id ?? file.fid ?? file.file_id ?? index),
      name: safeFileName(file.name ?? file.filename ?? file.server_filename ?? file.title ?? `File ${index + 1}`),
      size: Number(file.size ?? file.filesize ?? 0) || null,
      url: file.download_url ?? file.dlink ?? file.direct_link ?? file.url ?? file.downloadUrl ?? null,
      type: file.mime_type ?? file.type ?? null
    })).filter(file => {
      try {
        const u = new URL(String(file.url || ''));
        return u.protocol === 'https:';
      } catch { return false; }
    });

    if (!normalized.length) {
      return res.status(502).json({
        error: 'Resolver tidak mengembalikan tautan HTTPS yang dikenali.',
        detail: data.message || data.error || 'Periksa format respons API resolver.'
      });
    }

    return res.status(200).json({ ok: true, files: normalized, source: 'TeraBox resolver' });
  } catch (error) {
    return res.status(502).json({
      error: 'Tidak dapat menghubungi resolver TeraBox.',
      detail: error.name === 'TimeoutError'
        ? 'Permintaan ke resolver melewati batas waktu.'
        : 'Periksa URL resolver dan koneksi server.'
    });
  }
};
