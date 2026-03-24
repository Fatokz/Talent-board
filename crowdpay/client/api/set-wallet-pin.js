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
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { uid, pin } = req.body;
  if (!uid || !pin || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ message: 'A valid 4-digit numeric PIN is required.' });
  }

  // Hash the PIN with SHA-256 before storing — never store raw PINs
  const hashedPin = crypto.createHash('sha256').update(`${uid}:${pin}`).digest('hex');

  try {
    const db = admin.firestore();
    await db.collection('users').doc(uid).update({ walletPin: hashedPin });
    return res.status(200).json({ success: true, message: 'Wallet PIN set successfully.' });
  } catch (err) {
    console.error('set-wallet-pin error:', err);
    return res.status(500).json({ message: 'Failed to set PIN.' });
  }
}
