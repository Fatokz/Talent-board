/**
 * api/wallet-funding.js
 * Merged from initiate-wallet-funding.js + verify-wallet-funding.js
 *
 * POST /api/wallet-funding?action=initiate  — generate Interswitch payment params
 * POST /api/wallet-funding?action=verify    — verify payment and credit wallet
 */
import crypto from 'crypto';
import admin from 'firebase-admin';

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
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const action = req.query.action; // 'initiate' or 'verify'

  // ── INITIATE ──────────────────────────────────────────────────────────
  if (action === 'initiate') {
    const { amount, uid, email } = req.body;
    if (!amount || !uid || !email) return res.status(400).json({ message: 'Missing parameters' });

    try {
      const amountInKobo = Math.round(Number(amount) * 100);
      const txnRef = `CPW${Date.now()}`;
      const productId = process.env.INTERSWITCH_MERCHANT_CODE || 'MX276001';
      const payItemId = process.env.INTERSWITCH_PAY_ITEM_ID   || 'Default_Payable_MX276001';
      const currency = '566';
      const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
      // Simplify redirect URL to avoid hash mismatches with query params
      const siteRedirectUrl = `${protocol}://${req.headers.host}/dashboard`;
      
      const macKey = process.env.INTERSWITCH_MAC_KEY;
      const stringToHash = `${txnRef}${productId}${payItemId}${amountInKobo}${siteRedirectUrl}${macKey || 'TEST_MAC_KEY'}`;
      
      console.log('--- INTERSWITCH INITIATION ---');
      console.log('TxnRef:', txnRef);
      console.log('SiteURL:', siteRedirectUrl);
      console.log('Hash String:', stringToHash);
      
      const hash = crypto.createHash('sha512').update(stringToHash).digest('hex');

      return res.status(200).json({ txnRef, productId, payItemId, amount: amountInKobo, currency, siteRedirectUrl, hash, email, uid });
    } catch {
      return res.status(500).json({ message: 'Error initiating funding' });
    }
  }

  // ── VERIFY ────────────────────────────────────────────────────────────
  if (action === 'verify') {
    const { txnRef, amount, uid } = req.body;
    if (!txnRef || !amount || !uid) return res.status(400).json({ message: 'Missing details' });

    try {
      let isSuccess = false;
      const amountInKobo = Math.round(Number(amount) * 100);
      
      // Simulation Bypass
      if (txnRef.startsWith('SIM_')) {
        isSuccess = true;
        req.verifiedAmount = Number(amount);
      } else {
        const productId = process.env.INTERSWITCH_MERCHANT_CODE || 'MX276001';
        const macKey = process.env.INTERSWITCH_MAC_KEY;
        const hash = crypto.createHash('sha512')
          .update(`${productId}${txnRef}${macKey || 'TEST_MAC_KEY'}`)
          .digest('hex');
          
        const baseUrl = process.env.NODE_ENV === 'production'
          ? 'https://webpay.interswitchng.com/collections/api/v1/gettransaction.json'
          : 'https://qa.interswitchng.com/collections/api/v1/gettransaction.json';
          
        const response = await fetch(`${baseUrl}?merchantcode=${productId}&transactionreference=${txnRef}&amount=${amountInKobo}`, {
          headers: { Hash: hash }
        });
        const data = await response.json();
        if (data && (data.ResponseCode === '00' || data.ResponseCode === '000')) {
          isSuccess = true;
          req.verifiedAmount = Number(data.Amount) / 100;
        }
      }

      if (isSuccess) {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(uid);
        const actualNairaAmount = req.verifiedAmount || Number(amount);
        
        const newBalance = await db.runTransaction(async (t) => {
          const doc = await t.get(userRef);
          if (!doc.exists) throw new Error('User not found');
          const handled = doc.data().handledTxns || [];
          if (handled.includes(txnRef)) throw new Error('already verified');
          
          const newBal = (doc.data().walletBalance || 0) + actualNairaAmount;
          
          // Log Transaction
          const txnRef_final = txnRef || `CP_W_${Date.now()}`;
          t.set(db.collection('transactions').doc(txnRef_final), {
            uid,
            amount: actualNairaAmount,
            type: 'deposit',
            status: 'completed',
            reference: txnRef_final,
            description: 'Wallet Funding via Interswitch',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

          t.update(userRef, {
            walletBalance: newBal,
            loyaltyPoints: (doc.data().loyaltyPoints || 0) + 20,
            handledTxns: admin.firestore.FieldValue.arrayUnion(txnRef)
          });
          return newBal;
        });
        return res.status(200).json({ success: true, newBalance, message: 'Wallet funded successfully!' });
      } else {
        return res.status(400).json({ success: false, message: 'Payment verification failed.' });
      }
    } catch (err) {
      if (err.message?.includes('already verified')) {
        return res.status(200).json({ success: true, message: 'Already credited.' });
      }
      console.error('verify wallet funding error:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(400).json({ message: 'Invalid action. Use ?action=initiate or ?action=verify' });
}
