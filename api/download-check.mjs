export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Gunakan metode POST"
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Endpoint API berhasil diakses"
  });
}
