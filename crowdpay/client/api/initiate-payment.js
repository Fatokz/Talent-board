import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { amount, jarId, email } = req.body;

    if (!amount || !jarId || !email) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Interswitch requires amount in kobo (multiply NGN by 100)
    const amountInKobo = Math.round(Number(amount) * 100);
    
    // Generate a unique Transaction Reference for this payment
    const txnRef = `CP${Date.now()}`;
    
    // Environment Variables — your real Interswitch Merchant Account
    const productId   = process.env.INTERSWITCH_MERCHANT_CODE || 'MX276001';
    const payItemId   = process.env.INTERSWITCH_PAY_ITEM_ID   || 'Default_Payable_MX276001';
    const currency = '566'; // 566 is NGN (Naira)
    
    // Determine the Redirect URL after payment completion
    const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
    const siteRedirectUrl = `${protocol}://${req.headers.host}/dashboard?type=jar&jarId=${jarId}`;
    
    const macKey = process.env.INTERSWITCH_MAC_KEY; 
    
    if (!macKey) {
      console.warn("INTERSWITCH_MAC_KEY is missing from environment variables.");
    }

    // Interswitch documentation hash string concatenation formula:
    // txn_ref + product_id + pay_item_id + amount + site_redirect_url + mac_key
    const stringToHash = `${txnRef}${productId}${payItemId}${amountInKobo}${siteRedirectUrl}${macKey || 'TEST_MAC_KEY'}`;
    
    // Generate SHA-512 Hash
    const hash = crypto.createHash('sha512').update(stringToHash).digest('hex');

    // Return the required secure payload to the React frontend
    // The frontend will then inject these into an HTML form and POST to Interswitch WebPay URL
    res.status(200).json({
      txnRef,
      productId,
      payItemId,
      amount: amountInKobo,
      currency,
      siteRedirectUrl,
      hash,
      email,
      jarId
    });

  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
