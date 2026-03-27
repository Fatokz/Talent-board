import { db } from './firebase';
import { 
    collection, getDocs, query, where, addDoc,
    onSnapshot, doc, updateDoc, 
    getDoc, serverTimestamp,
    arrayUnion, setDoc
} from 'firebase/firestore';

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    description: string;
    image: string;
    images?: string[]; // Array of extra or all image URLs for gallery
    vendorId: string;
    status: 'active' | 'out_of_stock' | 'deleted';
    createdAt: number;
}

export interface Order {
    id: string;
    productId: string;
    productName: string;
    buyerId: string;
    buyerName: string;
    vendorId: string;
    amount: number;
    status: 'pending' | 'shipped' | 'delivered' | 'completed';
    createdAt: number;
}

// Represents a real Jar instantiated in the database
export interface Jar {
    id: string;
    name: string;
    category: string;
    goal: number;
    raised: number;
    members: string[]; // User IDs
    frequency: string;
    vendorId?: string; // ID of a verified vendor if this jar pays out directly to a merchant
    contributionAmount?: number; // Fixed per-cycle amount (Ajo) or minimum contribution (others)
    status: 'active' | 'completed' | 'PAYOUT_COMPLETED' | 'archived';
    createdBy: string;
    createdAt: number;
    targetDays?: number; // How many days the jar is active for
    jarType: 'solo' | 'collaborative';

    // --- Ajo (Rotating Savings) specific fields ---
    rotationMethod?: 'creator' | 'random' | 'join-order'; // How payout order is determined
    rotationOrder?: string[];   // Ordered list of member UIDs for payout turns
    currentRound?: number;      // Index into rotationOrder (which member is next)
    paidThisCycle?: string[];   // UIDs who have paid in the current cycle
    disbursedRounds?: number;   // How many payout rounds have been completed
    payoutStatus?: 'pending_request' | 'approved' | 'paid';
}

// Represents a payout / withdrawal request submitted for group vote
export interface WithdrawalRequest {
    id: string;
    jarId: string;
    jarName: string;
    jarCategory: string;
    requestedBy: string;       // User UID
    requestedByName: string;
    requestedByInitials: string;
    amount: number;
    reason: string;
    // Payout details
    destinationType?: 'internal_wallet' | 'vendor';
    vendorId?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    // Voting state — key is voter UID
    votes: Record<string, { decision: 'approved' | 'declined'; reason?: string }>;
    totalVoters: number;
    status: 'pending_votes' | 'approved' | 'declined' | 'disbursed';
    type: 'ajo_rotation' | 'goal_withdrawal'; // Route different logic at disbursal
    round?: number;            // For Ajo: which rotation round this request is for
    votingDeadline: number;    // Timestamp (ms)
    createdAt: number;
}

export interface Invite {
    id: string;
    jarId: string;
    jarName?: string;       // denormalized for display
    inviterId: string;
    inviterName?: string;   // denormalized for display
    inviteeEmail: string;
    inviteeName?: string;   // filled when a registered user is selected
    status: 'pending' | 'accepted' | 'declined';
    declineReason?: string;
    createdAt: number;
}

// Lightweight user profile returned by search
export interface UserProfile {
    uid: string;
    fullName: string;
    email: string;
    kycStatus?: 'unverified' | 'pending' | 'verified';
    nin?: string;
    phoneNumber?: string;
    address?: string;
    bankName?: string;
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
    walletBalance?: number; // Core crowdpay wallet integration
    walletPin?: string; // Hashed PIN if set
    loyaltyPoints?: number; // Phase 3 Rewards
    roles: ('user' | 'vendor')[];
    currentRole: 'user' | 'vendor';
    vendorId?: string; // Links to a doc in 'vendorProfiles' if they are a vendor
}

export interface VendorProfile {
    id: string; // Same as User UID or different? Usually same for 1:1, but here we'll use user.uid
    name: string;
    category: string;
    description: string;
    logo?: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    rating: number;
    ratingCount?: number;
    voters?: string[];
    verified: boolean;
    walletBalance: number; // For actual earnings
    pendingBalance: number; // For money in active jars
    createdAt: number;
}

export interface Message {
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
}

// 1. Create a new Jar
export const createJar = async (
    jarData: Omit<Jar, 'id' | 'createdAt' | 'raised' | 'members' | 'status'>,
    userId: string
) => {
    const jarsRef = collection(db, 'jars');
    const newJar: Omit<Jar, 'id'> = {
        ...jarData,
        raised: 0,
        members: [userId], // Creator is the first member
        status: 'active',
        createdAt: Date.now(),
    };

    const docRef = await addDoc(jarsRef, newJar);
    return docRef.id;
};

// 2. Fetch Jars for a specific user
export const getUserJars = async (userId: string): Promise<Jar[]> => {
    const jarsRef = collection(db, 'jars');
    const q = query(jarsRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Jar[];
};

// 2b. Realtime Listener for User Jars
export const subscribeToUserJars = (userId: string, callback: (jars: Jar[]) => void) => {
    const jarsRef = collection(db, 'jars');
    const q = query(jarsRef, where('members', 'array-contains', userId));

    return onSnapshot(q, (snapshot) => {
        const jars = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Jar[];
        callback(jars);
    });
};

// 3. Create an Invitation
export const createInvitation = async (
    jarId: string,
    inviterId: string,
    inviteeEmail: string,
    meta?: { jarName?: string; inviterName?: string; inviteeName?: string }
) => {
    const invitesRef = collection(db, 'invites');
    const newInvite: Omit<Invite, 'id'> = {
        jarId,
        inviterId,
        inviteeEmail: inviteeEmail.toLowerCase(),
        status: 'pending',
        createdAt: Date.now(),
        ...(meta?.jarName ? { jarName: meta.jarName } : {}),
        ...(meta?.inviterName ? { inviterName: meta.inviterName } : {}),
        ...(meta?.inviteeName ? { inviteeName: meta.inviteeName } : {}),
    };

    const docRef = await addDoc(invitesRef, newInvite);
    return docRef.id;
};

// 4. Fetch Pending Invites for a user's email
export const getPendingInvitesByEmail = async (email: string): Promise<Invite[]> => {
    const invitesRef = collection(db, 'invites');
    const q = query(
        invitesRef,
        where('inviteeEmail', '==', email.toLowerCase()),
        where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Invite[];
};

// ─── WITHDRAWAL REQUESTS ─────────────────────────────────────────────────────

// 5. Create a Withdrawal Request
export const createWithdrawalRequest = async (
    data: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'votes' | 'status'>
) => {
    const isSoloJar = data.totalVoters === 0;
    const ref = collection(db, 'withdrawalRequests');
    const newRequest: Omit<WithdrawalRequest, 'id'> = {
        ...data,
        votes: {},          // Empty — voting hasn't started
        status: isSoloJar ? 'approved' : 'pending_votes',
        createdAt: Date.now(),
    };
    const docRef = await addDoc(ref, newRequest);
    return docRef.id;
};

// 6. Realtime listener — all withdrawal requests for a specific jar
export const subscribeToJarWithdrawals = (
    jarId: string,
    callback: (requests: WithdrawalRequest[]) => void
) => {
    const ref = collection(db, 'withdrawalRequests');
    const q = query(ref, where('jarId', '==', jarId));
    return onSnapshot(q, snap => {
        const requests = snap.docs.map(d => ({ id: d.id, ...d.data() })) as WithdrawalRequest[];
        callback(requests);
    });
};

// ─── PAYOUT EXECUTION ────────────────────────────────────────────────────────

export const finalizeJarPayout = async (
    jarId: string,
    amount: number,
    destinationType: 'internal_wallet' | 'vendor',
    vendorId?: string
) => {
    const jarRef = doc(db, 'jars', jarId);
    
    // 1. Calculate Fees (200 Naira + 5% CrowdPay Commission)
    const fixedFee = 200;
    const commissionPct = 0.05;
    const commission = amount * commissionPct;
    const totalDeduction = fixedFee + commission;
    const netPayout = Math.max(0, amount - totalDeduction);

    // 2. Update Destination
    if (destinationType === 'vendor' && vendorId) {
        const vendorRef = doc(db, 'vendorProfiles', vendorId);
        const vendorSnap = await getDoc(vendorRef);
        if (vendorSnap.exists()) {
            const currentBal = vendorSnap.data().walletBalance || 0;
            await updateDoc(vendorRef, {
                walletBalance: currentBal + netPayout
            });
            
            // Record Vendor Transaction
            const txnsRef = collection(db, 'transactions');
            await addDoc(txnsRef, {
                uid: vendorId,
                type: 'vendor_payout',
                amount: netPayout,
                jarId,
                description: `Payout from Jar: ${jarId} (Less Fees: ₦${totalDeduction})`,
                timestamp: serverTimestamp(),
                status: 'completed'
            });
        }
    }

    // 3. Mark Jar as Paid and Archive/Reset if needed
    const jarSnap = await getDoc(jarRef);
    const jarData = jarSnap.data();
    
    if (jarData?.category === 'Traditional') {
        const nextDisbursed = (jarData.disbursedRounds || 0) + 1;
        const totalMembers = jarData.members?.length || 1;
        
        if (nextDisbursed >= totalMembers) {
            // FULL RESET after everyone collected
            await updateDoc(jarRef, {
                disbursedRounds: 0,
                currentRound: 0,
                raised: 0,
                balance: 0,
                payoutStatus: undefined,
                status: 'active' // Back to default as requested
            });
        } else {
            await updateDoc(jarRef, {
                disbursedRounds: nextDisbursed,
                currentRound: nextDisbursed, // Move to next person in rotation
                raised: 0,
                balance: 0,
                payoutStatus: undefined
            });
        }
    } else {
        // Goal-based jar (Product or Charity)
        await updateDoc(jarRef, {
            payoutStatus: 'paid',
            status: 'archived', // Reset/Archive as requested
            balance: 0,
            paidAt: Date.now()
        });
    }

    return { success: true, netPayout, totalDeduction };
};

// 6b. Realtime listener — all transactions for a specific jar
export const subscribeToJarTransactions = (
    jarId: string,
    callback: (txns: any[]) => void
) => {
    const ref = collection(db, 'transactions');
    const q = query(ref, where('jarId', '==', jarId));
    return onSnapshot(q, snap => {
        const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        txns.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        callback(txns);
    });
};

// 6c. Realtime listener — multiple user profiles by IDs
export const subscribeToJarMembers = (
    uids: string[],
    callback: (members: UserProfile[]) => void
) => {
    if (!uids.length) {
        callback([]);
        return () => {};
    }
    const ref = collection(db, 'users');
    const q = query(ref, where('uid', 'in', uids));
    return onSnapshot(q, snap => {
        const members = snap.docs.map(d => d.data() as UserProfile);
        callback(members);
    });
};

// 7. Realtime listener — all pending withdrawal requests for a user's jars
export const subscribeToUserPendingWithdrawals = (
    userId: string,
    callback: (requests: WithdrawalRequest[]) => void
) => {
    const ref = collection(db, 'withdrawalRequests');
    const q = query(ref, where('status', '==', 'pending_votes'));
    return onSnapshot(q, snap => {
        const requests = snap.docs.map(d => ({ id: d.id, ...d.data() })) as WithdrawalRequest[];
        callback(requests.filter(r => r.requestedBy !== userId));
    });
};

// 8. Cast a vote on a withdrawal request
export const castWithdrawalVote = async (
    requestId: string,
    voterId: string,
    decision: 'approved' | 'declined',
    reason?: string
) => {
    const reqRef = doc(db, 'withdrawalRequests', requestId);
    const snap = await getDoc(reqRef);
    if (!snap.exists()) throw new Error('Withdrawal request not found');

    const data = snap.data() as Omit<WithdrawalRequest, 'id'>;

    const updatedVotes = {
        ...data.votes,
        [voterId]: { decision, ...(reason ? { reason } : {}) },
    };

    const voteCount = Object.keys(updatedVotes).length;
    const allVoted = voteCount >= data.totalVoters;
    const unanimous = allVoted && Object.values(updatedVotes).every(v => v.decision === 'approved');
    const anyDeclined = Object.values(updatedVotes).some(v => v.decision === 'declined');

    const newStatus: WithdrawalRequest['status'] =
        unanimous ? 'approved' :
            anyDeclined ? 'declined' :
                'pending_votes';

    await updateDoc(reqRef, {
        [`votes.${voterId}`]: { decision, ...(reason ? { reason } : {}) },
        status: newStatus,
    });

    return newStatus;
};

// ─── AJO ROTATION ────────────────────────────────────────────────────────────

export const setAjoRotationOrder = async (jarId: string, rotationOrder: string[]) => {
    const jarRef = doc(db, 'jars', jarId);
    await updateDoc(jarRef, {
        rotationOrder,
        currentRound: 0,
        disbursedRounds: 0,
        paidThisCycle: [],
    });
};

export const markCyclePaid = async (jarId: string, userId: string) => {
    const jarRef = doc(db, 'jars', jarId);
    await updateDoc(jarRef, {
        paidThisCycle: arrayUnion(userId),
    });
};

export const advanceAjoRound = async (jarId: string, completedRound: number) => {
    const jarRef = doc(db, 'jars', jarId);
    await updateDoc(jarRef, {
        currentRound: completedRound + 1,
        disbursedRounds: completedRound + 1,
        paidThisCycle: [],
    });
};

export const markWithdrawalDisbursed = async (requestId: string) => {
    const reqRef = doc(db, 'withdrawalRequests', requestId);
    await updateDoc(reqRef, { status: 'disbursed' });
};

// ─── MESSAGING ──────────────────────────────────────────────────────────────

export const sendMessage = async (conversationId: string, message: Message) => {
    const chatRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(chatRef, message);
};

export const subscribeToMessages = (conversationId: string, callback: (msgs: Message[]) => void) => {
    const chatRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(chatRef);
    return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => d.data() as Message);
        callback(msgs);
    });
};

// ─── USER PROFILE & ROLE MANAGEMENT ──────────────────────────────────────────

export const updateCurrentRole = async (uid: string, role: 'user' | 'vendor') => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { currentRole: role });
};

export const createVendorProfile = async (uid: string, data: Omit<VendorProfile, 'id' | 'createdAt' | 'rating' | 'verified'>) => {
    const vendorRef = doc(db, 'vendorProfiles', uid);
    const userRef = doc(db, 'users', uid);
    
    const newProfile: VendorProfile = {
        ...data,
        id: uid,
        rating: 5.0,
        ratingCount: 1,
        voters: [],
        verified: false,
        walletBalance: 0,
        pendingBalance: 0,
        createdAt: Date.now()
    };

    await setDoc(vendorRef, newProfile);
    await updateDoc(userRef, { 
        roles: arrayUnion('vendor'),
        vendorId: uid 
    });
};

export const subscribeToVendorProfile = (vendorId: string, callback: (v: VendorProfile | null) => void) => {
    const vRef = doc(db, 'vendorProfiles', vendorId);
    return onSnapshot(vRef, (snap) => {
        if (snap.exists()) callback(snap.data() as VendorProfile);
        else callback(null);
    });
};

export const subscribeToUserDoc = (uid: string, callback: (user: UserProfile | null) => void) => {
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, snap => {
        if (snap.exists()) {
            callback(snap.data() as UserProfile);
        } else {
            callback(null);
        }
    });
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
};

export const searchUsers = async (q: string): Promise<UserProfile[]> => {
    if (!q || q.trim().length < 2) return [];
    const term = q.trim().toLowerCase();
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    return snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter(u =>
            u.fullName?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term)
        )
        .slice(0, 8);
};

export const subscribeToUserInvites = (
    email: string,
    callback: (invites: Invite[]) => void
) => {
    const ref = collection(db, 'invites');
    const q = query(ref, where('inviteeEmail', '==', email.toLowerCase()));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invite)));
    });
};

export const subscribeToSentInvites = (
    inviterId: string,
    callback: (invites: Invite[]) => void
) => {
    const ref = collection(db, 'invites');
    const q = query(ref, where('inviterId', '==', inviterId));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invite)));
    });
};

export const acceptInvite = async (inviteId: string, userId: string) => {
    const inviteRef = doc(db, 'invites', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error('Invite not found');

    const { jarId } = inviteSnap.data() as Invite;
    const jarRef = doc(db, 'jars', jarId);
    await updateDoc(jarRef, { members: arrayUnion(userId) });
    await updateDoc(inviteRef, { status: 'accepted' });
};

export const declineInvite = async (inviteId: string, reason?: string) => {
    const inviteRef = doc(db, 'invites', inviteId);
    await updateDoc(inviteRef, {
        status: 'declined',
        ...(reason ? { declineReason: reason } : {}),
    });
};

export const getJarById = async (jarId: string): Promise<Jar | null> => {
    const jarRef = doc(db, 'jars', jarId);
    const snap = await getDoc(jarRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Jar;
};

export const joinJarDirect = async (jarId: string, userId: string) => {
    const jarRef = doc(db, 'jars', jarId);
    await updateDoc(jarRef, {
        members: arrayUnion(userId)
    });
};

export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'status'>) => {
    const productsRef = collection(db, 'products');
    const newProduct: Omit<Product, 'id'> = {
        ...productData,
        status: 'active',
        createdAt: Date.now()
    };
    const docRef = await addDoc(productsRef, newProduct);
    return docRef.id;
};

export const subscribeToVendorProducts = (vendorId: string, callback: (products: Product[]) => void) => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('vendorId', '==', vendorId));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
};

export const subscribeToVendorOrders = (vendorId: string, callback: (orders: Order[]) => void) => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('vendorId', '==', vendorId));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });
};

export const updateProduct = async (productId: string, data: Partial<Product>) => {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, data);
};

export const deleteProduct = async (productId: string) => {
    const docRef = doc(db, 'products', productId);
    await setDoc(docRef, { status: 'deleted' }, { merge: true });
};

export const subscribeToAllProducts = (callback: (products: Product[]) => void) => {
    const productsRef = collection(db, 'products');
    // Fetch both active and out_of_stock; exclude deleted server-side isn't possible with OR in basic Firestore,
    // so we filter client-side after getting everything non-deleted.
    const q = query(productsRef, where('status', 'in', ['active', 'out_of_stock']));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
};

export const subscribeToAllVendors = (callback: (vendors: VendorProfile[]) => void) => {
    const vendorsRef = collection(db, 'vendorProfiles');
    return onSnapshot(vendorsRef, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as VendorProfile)));
    });
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
};

// ─── MARKETPLACE EXPANSION ───────────────────────────────────────────────────

export const rateVendor = async (vendorId: string, newRating: number, userId: string) => {
    const vendorRef = doc(db, 'vendorProfiles', vendorId);
    const snap = await getDoc(vendorRef);
    if (!snap.exists()) throw new Error('Vendor not found');
    
    const data = snap.data() as VendorProfile;
    const currentRating = data.rating || 5.0;
    const currentCount = data.ratingCount || 1;
    const voters = data.voters || [];

    if (voters.includes(userId)) {
        throw new Error('You have already rated this merchant');
    }

    const newCount = currentCount + 1;
    const computedRating = ((currentRating * currentCount) + newRating) / newCount;

    await updateDoc(vendorRef, {
        rating: Number(computedRating.toFixed(1)),
        ratingCount: newCount,
        voters: arrayUnion(userId)
    });
};

