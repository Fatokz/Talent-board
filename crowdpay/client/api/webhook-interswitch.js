/**
 * api/webhook-interswitch.js
 * 
 * Interswitch sends POST to this URL when a payment event occurs.
 * Set webhook URL in Interswitch dashboard to:
 *   https://crowdpayweb.vercel.app/api/webhook-interswitch
 */
import admin from 'firebase-admin';
import crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  // Always respond 200 immediately so Interswitch doesn't retry
  // (Process async below)
  if (req.method === 'GET') {
    // Interswitch may send a GET ping to verify the endpoint is alive
    return res.status(200).json({ success: true, message: 'CrowdPay Webhook Active' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    // Optional: Verify webhook signature with your Secret Key
    const secretKey = process.env.INTERSWITCH_WEBHOOK_SECRET;
    const signature = req.headers['x-interswitch-signature'] || req.headers['signature'];
    
    if (secretKey && signature) {
      const expectedSig = crypto
        .createHmac('sha512', secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      if (expectedSig !== signature) {
        console.warn('Webhook signature mismatch — rejected');
        return res.status(401).json({ message: 'Invalid webhook signature' });
      }
    }

    const { responseCode, transactionReference, amount, paymentReference: _paymentReference } = payload;
    
    console.log('Interswitch Webhook received:', { responseCode, transactionReference, amount });

    // responseCode '00' means successful payment
    if (responseCode === '00' && transactionReference) {
      const _db = admin.firestore();
      
      // Try to find which type of transaction this is
      // Check if it's a wallet funding transaction (txnRef starts with CP_W_)
      if (transactionReference.startsWith('CP_W_')) {
        // Find the user by pending txn reference if stored, or handle accordingly
        // For now just log — the verify-wallet-funding API handles the balance update
        console.log('Wallet funding webhook received for txn:', transactionReference);
      }
      
      // Check if it's a jar payment (txnRef starts with CP_)  
      if (transactionReference.startsWith('CP_') && !transactionReference.startsWith('CP_W_')) {
        console.log('Jar payment webhook received for txn:', transactionReference);
        // Jar payments are verified via verify-payment.js redirect flow
        // This webhook is a secondary confirmation
      }
    }

    return res.status(200).json({ success: true, received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 so Interswitch doesn't keep retrying
    return res.status(200).json({ success: false, message: 'Webhook received but processing failed internally' });
  }
}
