const SUPABASE_API = 'https://qyufbsvrophwzcwlkppv.supabase.co/functions/v1/bni-api';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: '只支援 POST request' });
  }

  try {
    const upstream = await fetch(SUPABASE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bni-token': req.headers['x-bni-token'] || ''
      },
      body: JSON.stringify(req.body || {})
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    return res.send(text);
  } catch (error) {
    console.error('BNI API proxy failed:', error);
    return res.status(502).json({
      error: '登入服務暫時未能連線，請稍後再試。',
      code: 'UPSTREAM_UNAVAILABLE'
    });
  }
}
