export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nin, fullName, uid } = req.body;

  if (!nin || nin.length !== 11) {
    return res.status(400).json({ success: false, message: 'Invalid NIN length. Must be 11 digits.' });
  }

  try {
    console.log(`[Interswitch KYC Mock] Verifying NIN: ${nin} for UID: ${uid}`);
    
    // Simulate Interswitch API latency
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulated Verification Logic (Fail if NIN starts with '0' to allow testing rejection)
    if (nin.startsWith('0')) {
      return res.status(400).json({
        success: false,
        message: 'NIN Verification Failed. Identity mismatch or invalid number.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        nin,
        fullName: fullName || 'Verified User',
        status: 'verified',
        message: 'Identity verified successfully via Interswitch'
      }
    });

  } catch (error) {
    console.error('NIN Verification Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error during verification' });
  }
}
