import crypto from 'crypto';
import axios from 'axios';
import admin from 'firebase-admin';

// Initialize Firebase Admin securely. 
// Vercel Serverless Functions can boot cold, we must ensure we only initialize once.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines from env vars
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { txnRef, amount, jarId } = req.body;

  if (!txnRef || !amount || !jarId) {
    return res.status(400).json({ message: 'Missing transaction details' });
  }

  try {
    const amountInKobo = Math.round(Number(amount) * 100);
    const productId = process.env.INTERSWITCH_PRODUCT_ID || '1076';
    const macKey = process.env.INTERSWITCH_MAC_KEY; 

    // Interswitch WebPAY Verification Hash Formula:
    // product_id + transactionreference + macKey
    const stringToHash = `${productId}${txnRef}${macKey || 'TEST_MAC_KEY'}`;
    const hash = crypto.createHash('sha512').update(stringToHash).digest('hex');

    const isProd = process.env.NODE_ENV === 'production';
    // Use the appropriate Interswitch URL for sandbox vs live
    const baseUrl = isProd 
      ? 'https://webpay.interswitchng.com/collections/api/v1/gettransaction.json'
      : 'https://qa.interswitchng.com/collections/api/v1/gettransaction.json';

    const merchantCode = process.env.INTERSWITCH_MERCHANT_CODE || 'MX000000000000';

    // 1. Call Interswitch Search API to get true status of the transaction
    const response = await axios.get(
      `${baseUrl}?merchantcode=${merchantCode}&transactionreference=${txnRef}&amount=${amountInKobo}`,
      { headers: { Hash: hash } }
    );

    const data = response.data;

    // ResponseCode '00' or '000' normally means approved in ISO-8583
    if (data && (data.ResponseCode === '00' || data.ResponseCode === '000')) {
      
      // 2. Payment Successful. Update Firebase directly via Admin SDK
      const db = admin.firestore();
      const jarRef = db.collection('jars').doc(jarId);
      
      // Use a Firestore Transaction to safely increment the jar's pooled amount
      await db.runTransaction(async (t) => {
        const doc = await t.get(jarRef);
        if (!doc.exists) throw new Error('Jar does not exist!');
        
        const currentPooled = doc.data().totalPooled || 0;
        const newPooled = currentPooled + Number(amount);
        
        t.update(jarRef, { totalPooled: newPooled });
      });

      return res.status(200).json({ 
        message: 'Payment Verified & Jar Updated successfully', 
        success: true, 
        interswitchData: data 
      });

    } else {
      return res.status(400).json({ 
        message: 'Payment Failed or Verification error', 
        success: false, 
        interswitchData: data 
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
