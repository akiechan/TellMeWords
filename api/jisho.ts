import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const keyword = req.query.keyword as string;
  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword query param' });
  }

  try {
    const response = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Jisho API error' });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Jisho proxy error:', err);
    return res.status(500).json({ error: 'Jisho lookup failed' });
  }
}
