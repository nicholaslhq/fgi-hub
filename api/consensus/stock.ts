import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchStockConsensusProd } from '../../src/services/index.server.js';

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    const result = await fetchStockConsensusProd();
    res.status(200).json(result);
  } catch (error) {
    console.error('Stock consensus error:', error);
    res.status(502).json({ error: 'Failed to aggregate stock consensus' });
  }
}