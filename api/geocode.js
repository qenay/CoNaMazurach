export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ features: [] });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=pl&limit=6&accept-language=pl`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CoNaMazurach Portal/1.0 (https://co-na-mazurach.vercel.app; conamazurach@gmail.com)',
        'Accept': 'application/json',
        'Accept-Language': 'pl',
        'Referer': 'https://co-na-mazurach.vercel.app',
      },
    });

    const data = await response.json();

    // Convert Nominatim → GeoJSON-like format (same as Photon)
    const features = data.map(d => ({
      properties: { name: d.display_name.split(',')[0].trim() },
      geometry: { coordinates: [parseFloat(d.lon), parseFloat(d.lat)] },
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ features });
  } catch (e) {
    res.status(200).json({ features: [], error: e.message });
  }
}
