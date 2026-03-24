/**
 * api/wallet-pin.js
 * Merged from set-wallet-pin.js + verify-wallet-pin.js
 * 
 * POST /api/wallet-pin?action=set    — hash and save a 4-digit PIN
 * POST /api/wallet-pin?action=verify — check PIN against stored hash
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

const hashPin = (uid, pin) =>
    crypto.createHash('sha256').update(`${uid}:${pin}`).digest('hex');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const action = req.query.action; // 'set' or 'verify'
  const { uid, pin } = req.body;

  if (!uid || !pin) return res.status(400).json({ message: 'uid and pin are required.' });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ message: 'PIN must be exactly 4 digits.' });

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);

  try {
    if (action === 'set') {
      await userRef.update({ walletPin: hashPin(uid, pin) });
      return res.status(200).json({ success: true, message: 'Wallet PIN set successfully.' });
    }

    if (action === 'verify') {
      const snap = await userRef.get();
      if (!snap.exists) return res.status(404).json({ message: 'User not found.' });
      const storedHash = snap.data().walletPin;
      if (!storedHash) return res.status(400).json({ success: false, message: 'No PIN set. Please set a wallet PIN first.' });
      const match = hashPin(uid, pin) === storedHash;
      return res.status(200).json({ success: match, message: match ? 'PIN verified.' : 'Incorrect PIN.' });
    }

    return res.status(400).json({ message: 'Invalid action. Use ?action=set or ?action=verify' });
  } catch (err) {
    console.error('wallet-pin error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}
