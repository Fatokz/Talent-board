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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ message: 'Missing requestId' });

  try {
    const db = admin.firestore();
    const requestRef = db.collection('withdrawalRequests').doc(requestId);
    
    // We must run logic in a Transaction to lock the document and prevent double-payouts
    const payoutResult = await db.runTransaction(async (t) => {
      const reqDoc = await t.get(requestRef);
      if (!reqDoc.exists) throw new Error('Withdrawal Request does not exist!');
      
      const requestData = reqDoc.data();
      console.log(`[Payout Trigger] Request: ${requestId}, Status: ${requestData.status}, Amount: ${requestData.amount}`);

      if (requestData.status === 'disbursed') {
        throw new Error('This request has already been disbursed to the wallet.');
      }

      if (requestData.status !== 'approved') {
        throw new Error('Governance Trigger Failed: This request is not fully approved yet.');
      }

      // Check Jar exists
      const jarRef = db.collection('jars').doc(requestData.jarId);
      const jarDoc = await t.get(jarRef);
      if (!jarDoc.exists) throw new Error('Associated Jar does not exist!');
      const jarData = jarDoc.data();

      // Deduction calculations
      const requestAmount = requestData.amount || 0;
      if (requestAmount <= 0) throw new Error('Invalid withdrawal amount');

      const platformFee = requestAmount * 0.03; // 3% platform fee
      const netPayout = requestAmount - platformFee;

      // Check Destination
      let targetUserId = requestData.requestedBy;
      if (requestData.destinationType === 'vendor') {
         if (!requestData.vendorId) throw new Error('Vendor Destination specified but no Vendor ID provided.');
         
         const vendorRef = db.collection('vendorProfiles').doc(requestData.vendorId);
         const vendorDoc = await t.get(vendorRef);
         if (!vendorDoc.exists) throw new Error('Invalid Vendor ID. Vendor does not exist.');
         
         targetUserId = requestData.vendorId;
      }

      // Target Wallet (User or Vendor)
      const userRef = db.collection('users').doc(targetUserId);
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error('Target User/Vendor Profile not found in users collection!');
      
      const userData = userDoc.data();
      const currentBalance = userData.walletBalance || 0;
      const newBalance = currentBalance + netPayout;

      const requesterRef = db.collection('users').doc(requestData.requestedBy);

      // ---- EXECUTE ALL MUTATIONS IN TRANSACTION ----
      // 1. Mark request as disbursed
      t.update(requestRef, { status: 'disbursed' });

      // 2. Add to target wallet instantly
      t.update(userRef, { walletBalance: newBalance });

      // 3. Loyalty Points Accrual
      if (targetUserId !== requestData.requestedBy) {
          const requesterDoc = await t.get(requesterRef);
          if (requesterDoc.exists) {
              const rData = requesterDoc.data();
              t.update(requesterRef, { loyaltyPoints: (rData.loyaltyPoints || 0) + 50 });
          }
      } else {
          t.update(userRef, { loyaltyPoints: (userData.loyaltyPoints || 0) + 50 });
      }

      const txnRef = `CP_PAYOUT_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      t.set(db.collection('transactions').doc(txnRef), {
          uid: targetUserId,
          amount: netPayout,
          type: 'deposit', // Positive credit into wallet
          status: 'completed',
          reference: txnRef,
          description: `Payout from Jar: ${jarData.name} (Inc. 3% CrowdPay service fee)`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
              requestId,
              jarId: requestData.jarId,
              grossAmount: requestAmount,
              platformFee: platformFee,
              feePercentage: 0.03,
              payoutType: requestData.type
          }
      });

      // Platform Revenue Tracking for Admin Dashboard
      const revenueRef = db.collection('platformRevenue').doc();
      t.set(revenueRef, {
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          amount: platformFee,
          source: 'jar_payout',
          jarId: requestData.jarId,
          requestId: requestId,
          grossAmount: requestAmount,
          feePercentage: 0.03
      });

      // 4. Update Jar stats natively
      if (requestData.type === 'goal_withdrawal') {
        // Reset goal jar to default (active and empty) so it can be used again
        t.update(jarRef, { 
            totalPooled: 0, 
            raised: 0,
            status: 'active' // Move back to default active state
        });
      } else if (requestData.type === 'ajo_rotation') {
        const totalMembers = jarData.rotationOrder?.length || (jarData.members?.length || 1);
        const nextRound = (jarData.currentRound || 0) + 1;
        
        if (nextRound >= totalMembers) {
            // FULL CYCLE COMPLETE - RESET TO DEFAULT
            t.update(jarRef, { 
                currentRound: 0, 
                disbursedRounds: 0, 
                paidThisCycle: [],
                raised: 0,
                status: 'active'
            });
        } else {
            // MOVE TO NEXT ROUND
            t.update(jarRef, { 
                currentRound: nextRound, 
                disbursedRounds: nextRound, 
                paidThisCycle: [],
                raised: 0 
            });
        }
      }

      return { requestAmount, netPayout, platformFee, newBalance };
    });

    return res.status(200).json({ 
      message: 'Wallet Credited Successfully', 
      success: true, 
      details: payoutResult
    });

  } catch (error) {
    console.error('Error executing payout to wallet:', error);
    res.status(400).json({ message: 'Payout execution failed', error: error.message });
  }
}
