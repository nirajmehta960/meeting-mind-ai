const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://stratifypm.mayur.app',
];

function setCORS(req, res) {
  const origin = req.headers.origin || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];
  const reqHeaders = req.headers['access-control-request-headers'] || 'Content-Type';
  
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', reqHeaders);
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  try {
    setCORS(req, res);
    
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const apiKey = process.env.VITE_EXA_API_KEY;
    // console.log('API Key check:', { hasKey: !!apiKey, keyLength: apiKey?.length });
    
    if (!apiKey) {
      console.error('Missing VITE_EXA_API_KEY environment variable');
      return res.status(500).json({ error: 'Missing API key configuration' });
    }

    // console.log('Making request to Exa API with body:', req.body);

    const upstream = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(req.body),
    });

    // console.log('Exa API response status:', upstream.status);

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error('Exa API error:', upstream.status, errorText);
      return res.status(upstream.status).json({ 
        error: `Exa API error: ${upstream.status}`,
        details: errorText 
      });
    }

    const text = await upstream.text();
    // console.log('Exa API response length:', text.length);
    
    return res.status(200).send(text);
  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({ 
      error: err?.message || 'Unknown error',
      type: err?.constructor?.name || 'Unknown'
    });
  }
}