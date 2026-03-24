import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { amount, uid, email } = req.body;
    if (!amount || !uid || !email) return res.status(400).json({ message: 'Missing parameters' });

    const amountInKobo = Math.round(Number(amount) * 100);
    const txnRef = `CP_W_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const productId = process.env.INTERSWITCH_MERCHANT_CODE || 'MX179536';
    const payItemId = process.env.INTERSWITCH_PAY_ITEM_ID   || 'Default_Payable_MX179536';
    const currency = '566';
    
    // Redirect User back to Dashboard immediately after Interswitch WebPAY is done
    const siteRedirectUrl = process.env.SITE_URL 
      ? `${process.env.SITE_URL}/dashboard?wallet_funded=${txnRef}&amount=${amount}` 
      : `http://localhost:5173/dashboard?wallet_funded=${txnRef}&amount=${amount}`;
    
    const macKey = process.env.INTERSWITCH_MAC_KEY; 
    const stringToHash = `${txnRef}${productId}${payItemId}${amountInKobo}${siteRedirectUrl}${macKey || 'TEST_MAC_KEY'}`;
    const hash = crypto.createHash('sha512').update(stringToHash).digest('hex');

    res.status(200).json({
      txnRef, productId, payItemId, amount: amountInKobo, currency, siteRedirectUrl, hash, email, uid
    });
  } catch (error) {
    res.status(500).json({ message: 'Error initiating funding' });
  }
}
