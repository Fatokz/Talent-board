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
  // In production, you would protect this endpoint with a Vercel Cron Secret
  // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  //    return res.status(401).json({ message: 'Unauthorized' });
  // }
  
  if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const db = admin.firestore();
    const jarsSnapshot = await db.collection('jars').where('status', '==', 'active').get();
    
    let processedCount = 0;
    let autoPaidAmount = 0;
    let failures = [];

    // Process all active jars
    for (const jarDoc of jarsSnapshot.docs) {
      const jar = jarDoc.data();
      const members = jar.members || [];
      const paidThisCycle = jar.paidThisCycle || [];
      
      // Determine per-user contribution
      const expectedAmount = jar.contributionAmount || (jar.goal && members.length > 0 ? (jar.goal / members.length) : 0);
      
      if (expectedAmount <= 0) continue; // Nothing to deduct

      const membersToPay = members.filter(uid => !paidThisCycle.includes(uid));
      
      for (const uid of membersToPay) {
         try {
             await db.runTransaction(async (t) => {
                 const userRef = db.collection('users').doc(uid);
                 const userDoc = await t.get(userRef);
                 if (!userDoc.exists) return;
                 
                 const userData = userDoc.data();
                 const balance = userData.walletBalance || 0;
                 
                 // Auto-Pay Logic: Check Wallet Balance before hitting the bank API
                 if (balance >= expectedAmount) {
                     // 1. Deduct wallet & award 10 Loyalty Points for on-time automated contribution!
                     const currentPoints = userData.loyaltyPoints || 0;
                     t.update(userRef, { 
                         walletBalance: balance - expectedAmount,
                         loyaltyPoints: currentPoints + 10
                     });
                     
                     // 2. Increment Jar aggregated funds natively
                     const freshJarDoc = await t.get(jarDoc.ref);
                     const freshJar = freshJarDoc.data();
                     const newRaised = (freshJar.raised || freshJar.totalPooled || 0) + expectedAmount;
                     
                     t.update(jarDoc.ref, { 
                         raised: newRaised, 
                         totalPooled: newRaised,
                         paidThisCycle: admin.firestore.FieldValue.arrayUnion(uid)
                     });
                     
                     processedCount++;
                     autoPaidAmount += expectedAmount;
                 } else {
                     // Insufficient funds for auto-pay this cycle
                     failures.push({ uid, jarId: jarDoc.id, reason: 'Insufficient funds in Wallet' });
                 }
             });
         } catch(err) {
            console.error(`Auto-pay transaction failed for user ${uid} in jar ${jarDoc.id}`, err);
            failures.push({ uid, jarId: jarDoc.id, reason: err.message });
         }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Auto-Pay logic successfully executed across all Active Jars.', 
      processedCount, 
      autoPaidAmount,
      failures
    });

  } catch (error) {
    console.error('Auto-pay error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
