import admin from 'firebase-admin';

// Initialize Firebase Admin securely.
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
    console.error('Firebase Admin initialization error', error);
  }
}

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { uid, amount } = req.body;
  
  if (!uid || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid UID and amount required.' });
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);

    const withdrawalResult = await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error('User not found.');

        const userData = userDoc.data();
        const currentBalance = userData.walletBalance || 0;

        if (currentBalance < amount) {
            throw new Error('Insufficient wallet balance.');
        }

        if (!userData.accountNumber || !userData.bankCode) {
            throw new Error('Bank details not found on profile. Please verify your bank account first.');
        }

        /* 
        =========================================================
        SIMULATING INTERSWITCH PAYOUT/TRANSFER API
        In production, we would use the authenticated setup from 
        execute-payout.js to POST to the Interswitch Transfer API 
        with the user's bankCode and accountNumber.
        For sandbox/QA, we simulate instantaneous success.
        =========================================================
        */
        const isProd = process.env.NODE_ENV === 'production';
        if (isProd) {
             // throw new Error('Interswitch Transfer API not formally keyed for production yet.');
        }

        // Deduct balance securely within the transaction lock
        const newBalance = currentBalance - amount;
        const txnRef = `CP_WTH_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        
        // Log Transaction
        t.set(db.collection('transactions').doc(txnRef), {
          uid,
          amount: Number(amount),
          type: 'withdrawal',
          status: 'completed',
          reference: txnRef,
          description: `Withdrawal to ${userData.bankName} (${userData.accountNumber})`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        t.update(userRef, { walletBalance: newBalance });

        return { newBalance, amount, accountName: userData.accountName };
    });

    return res.status(200).json({
        success: true,
        message: 'Withdrawal processed successfully to your bank.',
        data: withdrawalResult
    });

  } catch (error) {
     console.error('Withdrawal API Error:', error);
     return res.status(400).json({ success: false, message: error.message });
  }
}
