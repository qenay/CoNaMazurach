export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.GITHUB_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN not set' });

  const OWNER = 'qenay';
  const REPO  = 'CoNaMazurach';
  const PATH  = 'public/pending-listings.json';

  const gh = {
    'Authorization':        `Bearer ${TOKEN}`,
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type':         'application/json',
    'User-Agent':           'CoNaMazurach-Admin/1.0',
  };

  async function read() {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, { headers: gh });
    if (r.status === 404) return { items: [], sha: null };
    if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
    const d = await r.json();
    return { items: JSON.parse(Buffer.from(d.content, 'base64').toString('utf-8')), sha: d.sha };
  }

  async function write(items, sha) {
    const content = Buffer.from(JSON.stringify(items, null, 2), 'utf-8').toString('base64');
    const body = { message: 'Update pending listings [skip vercel]', content };
    if (sha) body.sha = sha;
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
      method: 'PUT', headers: gh, body: JSON.stringify(body),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
  }

  try {
    if (req.method === 'GET') {
      const { items } = await read();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const { pending } = req.body || {};
      if (!pending) return res.status(400).json({ error: 'missing pending' });
      const { items, sha } = await read();
      const item = { ...pending, id: Date.now(), submittedAt: new Date().toISOString() };
      await write([...items, item], sha);
      return res.status(200).json({ ok: true, id: item.id });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'missing id' });
      const { items, sha } = await read();
      await write(items.filter(i => String(i.id) !== String(id)), sha);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('pending API error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
