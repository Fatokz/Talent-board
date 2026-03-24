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
  if (!uid || !pin) return res.status(400).json({ message: 'UID and PIN are required.' });

  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found.' });

    const storedHash = userDoc.data().walletPin;
    if (!storedHash) return res.status(400).json({ success: false, message: 'No PIN has been set. Please set a wallet PIN first.' });

    const hashedInput = crypto.createHash('sha256').update(`${uid}:${pin}`).digest('hex');
    const match = hashedInput === storedHash;

    return res.status(200).json({ success: match, message: match ? 'PIN verified.' : 'Incorrect PIN.' });
  } catch (err) {
    console.error('verify-wallet-pin error:', err);
    return res.status(500).json({ message: 'Verification failed.' });
  }
}
