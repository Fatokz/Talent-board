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

const hashPin = (uid, pin) => crypto.createHash('sha256').update(`${uid}:${pin}`).digest('hex');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { action } = req.query;
  const { uid, pin, amount } = req.body;

  if (!uid || !pin || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Missing core parameters (UID, PIN, Amount).' });
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);

    // UNIFIED TRANSACTION BLOCK
    const result = await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error('User not found.');

        const userData = userDoc.data();
        
        // 1. PIN VERIFICATION
        if (!userData.walletPin) throw new Error('No Wallet PIN set. Please set one in your profile.');
        if (hashPin(uid, pin) !== userData.walletPin) throw new Error('Incorrect Wallet PIN.');

        const currentBalance = userData.walletBalance || 0;

        // ── ACTION: WALLET WITHDRAW ──────────────────────────────────────────
        if (!action || action === 'wallet-withdraw') {
            if (currentBalance < amount) throw new Error('Insufficient wallet balance.');
            if (!userData.accountNumber || !userData.bankCode) throw new Error('Bank details not found.');

            const txnRef = `CP_WTH_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
            const newBalance = currentBalance - amount;

            t.set(db.collection('transactions').doc(txnRef), {
                uid, amount: Number(amount), type: 'withdrawal', status: 'completed',
                reference: txnRef, description: `Withdrawal to ${userData.bankName} (${userData.accountNumber})`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

            t.update(userRef, { 
                walletBalance: newBalance,
                handledTxns: admin.firestore.FieldValue.arrayUnion(txnRef)
            });

            return { success: true, message: 'Withdrawal processed.', txnRef, newBalance };
        }

        // ── ACTION: FUND JAR FROM WALLET ────────────────────
        if (action === 'fund-jar-from-wallet') {
            const { jarId, jarName } = req.body;
            if (!jarId) throw new Error('Jar ID required.');
            if (currentBalance < amount) throw new Error('Insufficient wallet balance.');

            const jarRef = db.collection('jars').doc(jarId);
            const jarDoc = await t.get(jarRef);
            if (!jarDoc.exists) throw new Error('Jar not found.');

            const txnRef = `CP_J_WAL_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
            const newBalance = currentBalance - amount;

            t.update(jarRef, { raised: admin.firestore.FieldValue.increment(Number(amount)) });

            t.set(db.collection('transactions').doc(txnRef), {
                uid, amount: Number(amount), type: 'jar_withdrawal', status: 'completed',
                reference: txnRef, description: `Contribution to ${jarName || jarDoc.data().name} from Wallet`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

            t.update(userRef, { 
                walletBalance: newBalance,
                handledTxns: admin.firestore.FieldValue.arrayUnion(txnRef)
            });

            return { success: true, message: 'Jar funded successfully.', txnRef, newBalance };
        }

        // ── ACTION: JAR REQUEST ─────────────────────────────
        if (action === 'jar-request') {
            const { jarId, jarName, jarCategory, reason, destinationType, vendorId, totalVoters, type, round } = req.body;
            const initials = (userData.fullName ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const votingDeadline = Date.now() + 72 * 60 * 60 * 1000;

            const requestRef = db.collection('withdrawalRequests').doc();
            t.set(requestRef, {
                jarId, jarName, jarCategory, requestedBy: uid, requestedByName: userData.fullName || 'Unknown',
                requestedByInitials: initials, amount: Number(amount), reason, destinationType,
                ...(destinationType === 'vendor' && { vendorId }), totalVoters, type,
                ...(round !== undefined && { round }), votingDeadline, votes: {},
                status: totalVoters === 0 ? 'approved' : 'pending_votes',
                createdAt: Date.now(),
            });

            return { success: true, message: 'Request submitted.', requestId: requestRef.id };
        }

        throw new Error('Invalid financial action.');
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Finance API Error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
}
