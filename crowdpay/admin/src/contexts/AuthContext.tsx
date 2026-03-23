import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [adminEmails, setAdminEmails] = useState<string[]>(['admin@crowdpay.com']);

    // Listen to admin emails from Firestore
    useEffect(() => {
        const settingsRef = doc(db, 'system', 'settings');
        const unsubscribe = onSnapshot(settingsRef, (snap) => {
            if (snap.exists() && snap.data().adminEmails) {
                setAdminEmails(snap.data().adminEmails);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && adminEmails.includes(user.email || '')) {
                setUser(user);
            } else if (user) {
                // If they logged in but aren't an admin, sign them out immediately
                auth.signOut();
                setUser(null);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [adminEmails]); // Re-evaluate auth if the admin list changes!

    const login = async (email: string, password: string) => {
        // Double check against latest firestore read before attempting auth
        const settingsRef = doc(db, 'system', 'settings');
        const snap = await getDoc(settingsRef);
        let currentAdmins = adminEmails;
        if (snap.exists() && snap.data().adminEmails) {
            currentAdmins = snap.data().adminEmails;
        }

        if (!currentAdmins.includes(email.toLowerCase())) {
            throw new Error('Not authorized as an administrator.');
        }
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAdminAuth = () => useContext(AuthContext);
