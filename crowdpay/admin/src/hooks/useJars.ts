import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Jar {
    id: string;
    name: string;
    category: string;
    goal: number;
    raised: number;
    members: string[]; // User IDs
    frequency: string;
    contributionAmount?: number;
    status: 'active' | 'completed';
    createdBy: string;
    createdAt: number;
}

export function useJars() {
    const [jars, setJars] = useState<Jar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const jarsRef = collection(db, 'jars');
        // Order by creation time descending if possible, or just fetch all
        const q = query(jarsRef);

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedJars = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Jar[];
                
                // Sort by createdAt descending manually if not indexed
                fetchedJars.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                
                setJars(fetchedJars);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching jars:", err);
                setError(err.message || "Failed to load jars");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { jars, loading, error };
}
