export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ features: [] });

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=pl&limit=6`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CoNaMazurach/1.0 conamazurach@gmail.com',
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ features: [] });
  }
}
