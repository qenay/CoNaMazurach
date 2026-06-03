export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.GITHUB_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN not set' });

  const OWNER = 'qenay';
  const REPO  = 'CoNaMazurach';
  const PATH  = 'public/listings.json';

  const ghHeaders = {
    'Authorization':        `Bearer ${TOKEN}`,
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type':         'application/json',
    'User-Agent':           'CoNaMazurach-Admin/1.0',
  };

  try {
    // GET — read listings from GitHub (always fresh, no cache)
    if (req.method === 'GET') {
      const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, { headers: ghHeaders });
      if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`);
      const { content } = await getRes.json();
      const listings = JSON.parse(Buffer.from(content, 'base64').toString('utf-8'));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(listings);
    }

    // POST — save listings to GitHub (no Vercel rebuild)
    if (req.method === 'POST') {
      const { listings } = req.body;
      if (!Array.isArray(listings)) return res.status(400).json({ error: 'listings must be an array' });

      const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, { headers: ghHeaders });
      if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`);
      const { sha } = await getRes.json();

      const content = Buffer.from(JSON.stringify(listings, null, 2), 'utf-8').toString('base64');
      const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: 'Update listings via admin panel [skip vercel]',
          content,
          sha,
        }),
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(`GitHub PUT failed: ${putRes.status} — ${err.message}`);
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('listings API error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
