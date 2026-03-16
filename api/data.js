const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function supabase(path) {
  // New Supabase publishable keys (sb_publishable_...) use a different auth header
  const isNewKey = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('sb_');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (isNewKey) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    headers['apikey'] = SUPABASE_ANON_KEY;
    headers['X-Client-Info'] = 'supabase-js/2.0.0';
  } else {
    // Legacy JWT key format (eyJ...)
    headers['apikey'] = SUPABASE_ANON_KEY;
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  // Validate env vars are set
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({
      error: 'Missing environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set in Vercel'
    });
  }

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
