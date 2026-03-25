import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, subscribeToUserDoc, updateCurrentRole as dbUpdateRole } from '../lib/db';

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    switchRole: (role: 'user' | 'vendor') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
    return useContext(AuthContext);
}

/** Ensures a Firestore user document exists for any auth method. */
async function ensureUserProfile(user: User): Promise<UserProfile | null> {
    if (!db) return null;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
        const newData: any = {
            uid: user.uid,
            fullName: user.displayName || '',
            email: user.email || '',
            trustScore: 500,
            walletBalance: 0,
            kycStatus: 'unverified',
            roles: ['user'],
            currentRole: 'user',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, newData);
        return newData;
    }
    return snap.data() as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubProfile: (() => void) | undefined;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await ensureUserProfile(user);
                unsubProfile = subscribeToUserDoc(user.uid, (profile) => {
                    setUserProfile(profile);
                });
            } else {
                setUserProfile(null);
                if (unsubProfile) unsubProfile();
            }
            setCurrentUser(user);
            setLoading(false);
        });
        return () => {
            unsubscribe();
            if (unsubProfile) unsubProfile();
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
            const profile = await ensureUserProfile(result.user);
            if (profile) setUserProfile(profile);
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const switchRole = async (role: 'user' | 'vendor') => {
        if (currentUser) {
            await dbUpdateRole(currentUser.uid, role);
        }
    };

    const value = { currentUser, userProfile, loading, signInWithGoogle, signOut, switchRole };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
