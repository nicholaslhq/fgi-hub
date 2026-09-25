import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchCryptoConsensusProd } from '../../src/services/index.server.js';

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    const result = await fetchCryptoConsensusProd();
    res.status(200).json(result);
  } catch (error) {
    console.error('Crypto consensus error:', error);
    res.status(502).json({ error: 'Failed to aggregate crypto consensus' });
  }
}