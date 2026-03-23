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
    const txnRef = `CP_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Environment Variables specific to your Interswitch Merchant account
    const productId = process.env.INTERSWITCH_PRODUCT_ID || '1076';     // Default test Product ID
    const payItemId = process.env.INTERSWITCH_PAY_ITEM_ID || '101001';  // Default test Pay Item ID
    const currency = '566'; // 566 is NGN (Naira)
    
    // Determine the Redirect URL after payment completion (locally or production Vercel URL)
    const siteRedirectUrl = process.env.SITE_URL 
      ? `${process.env.SITE_URL}/jar/${jarId}` 
      : 'http://localhost:5173/dashboard';
    
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
