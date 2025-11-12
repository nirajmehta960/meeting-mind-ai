export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    message: 'Simple test function',
    method: req.method,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
}