import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserProfile {
    uid?: string;
    id?: string;
    fullName: string;
    email: string;
    createdAt?: number;
}

export function useUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedUsers = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as UserProfile[];
                
                setUsers(fetchedUsers);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching users:", err);
                setError(err.message || "Failed to load users");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { users, loading, error };
}
