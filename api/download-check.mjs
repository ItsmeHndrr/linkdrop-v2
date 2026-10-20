export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Gunakan POST"
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Endpoint POST dapat diakses"
  });
}
