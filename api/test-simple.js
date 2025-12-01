/**
 * Simplest possible API route to test if vercel dev is working
 */

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ message: 'API is working', timestamp: Date.now() });
}
