export default function handler(request, response) {
  response.status(200).json({
    message: 'Hello from CrowdPay Serverless Backend!',
    status: 'live',
    timestamp: new Date().toISOString()
  });
}
