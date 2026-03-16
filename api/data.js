const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function supabase(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const type = req.query.type || 'chapters';

  try {
    if (type === 'series') {
      const data = await supabase('series?select=*&limit=1');
      return res.status(200).json(data[0] || null);
    }

    if (type === 'chapters') {
      const data = await supabase('chapters?select=*&order=number.asc');
      return res.status(200).json(data);
    }

    if (type === 'chapter') {
      const num = req.query.number;
      if (!num) return res.status(400).json({ error: 'Missing number param' });
      const data = await supabase(`chapters?select=*&number=eq.${num}&limit=1`);
      return res.status(200).json(data[0] || null);
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
