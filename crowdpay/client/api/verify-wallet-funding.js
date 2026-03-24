import crypto from 'crypto';
import axios from 'axios';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin init error', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { txnRef, amount, uid } = req.body;
  if (!txnRef || !amount || !uid) return res.status(400).json({ message: 'Missing details' });

  try {
    const amountInKobo = Math.round(Number(amount) * 100);
    const productId = process.env.INTERSWITCH_PRODUCT_ID || '1076';
    const macKey = process.env.INTERSWITCH_MAC_KEY; 
    const stringToHash = `${productId}${txnRef}${macKey || 'TEST_MAC_KEY'}`;
    const hash = crypto.createHash('sha512').update(stringToHash).digest('hex');
    const isProd = process.env.NODE_ENV === 'production';
    const baseUrl = isProd 
      ? 'https://webpay.interswitchng.com/collections/api/v1/gettransaction.json'
      : 'https://qa.interswitchng.com/collections/api/v1/gettransaction.json';

    const merchantCode = process.env.INTERSWITCH_MERCHANT_CODE || 'MX000000000000';

    // --- KYC SANDBOX BYPASS FOR SEAMLESS FUNDING TESTING ---
    const isBypassEnabled = process.env.VITE_ENABLE_KYC_BYPASS === 'true';
    let isSuccess = false;

    if (isBypassEnabled) {
      isSuccess = true;
    } else {
      const response = await axios.get(
        `${baseUrl}?merchantcode=${merchantCode}&transactionreference=${txnRef}&amount=${amountInKobo}`,
        { headers: { Hash: hash } }
      );
      const data = response.data;
      if (data && (data.ResponseCode === '00' || data.ResponseCode === '000')) {
        isSuccess = true;
      }
    }

    if (isSuccess) {
      const db = admin.firestore();
      const userRef = db.collection('users').doc(uid);
      
      const newBalance = await db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) throw new Error('User does not exist!');
        
        // Prevent double crediting the same Interswitch txn
        const handledTxns = doc.data().handledTxns || [];
        if (handledTxns.includes(txnRef)) {
            throw new Error('Transaction already verified & credited.');
        }

        const currentBalance = doc.data().walletBalance || 0;
        const currentPoints = doc.data().loyaltyPoints || 0;
        const newBal = currentBalance + Number(amount);
        
        t.update(userRef, { 
            walletBalance: newBal,
            loyaltyPoints: currentPoints + 20, // 20 Loyalty points for funding wallet
            handledTxns: admin.firestore.FieldValue.arrayUnion(txnRef) 
        });
        return newBal;
      });

      return res.status(200).json({ success: true, newBalance, message: "Wallet successfully fueled via Interswitch!" });
    } else {
      return res.status(400).json({ success: false, message: 'Payment Verification failed on Interswitch.' });
    }
  } catch (error) {
    if (error.message.includes('already verified')) {
        return res.status(200).json({ success: true, message: 'Already credited' });
    }
    console.error('Error verifying wallet funding:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
