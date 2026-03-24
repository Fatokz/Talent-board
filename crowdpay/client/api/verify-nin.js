export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Note: We expect firstName and lastName separately to match the Interswitch API spec
  const { nin, firstName, lastName, uid } = req.body;

  if (!nin || nin.length !== 11) {
    return res.status(400).json({ success: false, message: 'Invalid NIN. Must be 11 digits.' });
  }
// testing 
  try {
    const clientId = process.env.INTERSWITCH_CLIENT_ID;
    const clientSecret = process.env.INTERSWITCH_CLIENT_SECRET;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // 1. GET OAUTH ACCESS TOKEN
    const tokenResponse = await fetch('https://qa.interswitchng.com/passport/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        'scope': 'profile',
        'grant_type': 'client_credentials'
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.description || 'Failed to obtain access token');
    }

    const accessToken = tokenData.access_token;

    // 2. VERIFY NIN VIA MARKETPLACE ROUTING
    const verifyResponse = await fetch('https://api-marketplace-routing.k8.isw.la/marketplace-routing/api/v1/verify/identity/nin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        firstName,
        lastName,
        nin
      })
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || verifyData.responseCode === 'ERROR') {
      return res.status(400).json({
        success: false,
        message: verifyData.message || 'NIN Verification Failed'
      });
    }

    // 3. SUCCESS RESPONSE
    return res.status(200).json({
      success: true,
      data: {
        status: 'verified',
        firstName: verifyData.data.nin.firstname,
        lastName: verifyData.data.nin.lastname,
        gender: verifyData.data.nin.gender,
        message: 'Identity verified successfully via Interswitch'
      }
    });

  } catch (error) {
    console.error('Interswitch KYC Error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error during Interswitch verification' 
    });
  }
}