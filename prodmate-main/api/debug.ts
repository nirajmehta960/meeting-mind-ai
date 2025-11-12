import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.VITE_EXA_API_KEY;
    
    return res.status(200).json({
      message: 'Debug info',
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
      nodeVersion: process.version,
      env: Object.keys(process.env).filter(key => key.includes('EXA') || key.includes('VITE'))
    });
  } catch (err: any) {
    return res.status(500).json({ 
      error: err?.message || 'Unknown error',
      stack: err?.stack
    });
  }
}