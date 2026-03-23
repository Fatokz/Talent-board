import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SystemSettings {
    maxJarsPerUser: number;
    transactionFeePercentage: number;
    minGoalAmount: number;
    adminEmails: string[];
}

const DEFAULT_SETTINGS: SystemSettings = {
    maxJarsPerUser: 5,
    transactionFeePercentage: 1.5,
    minGoalAmount: 5000,
    adminEmails: ['admin@crowdpay.com'],
};

export function useSettings() {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const settingsRef = doc(db, 'system', 'settings');
        
        const initSettings = async () => {
            try {
                const snap = await getDoc(settingsRef);
                if (!snap.exists()) {
                    // Seed default settings if they don't exist yet
                    await setDoc(settingsRef, DEFAULT_SETTINGS);
                }
            } catch (err: any) {
                console.error("Error initializing settings:", err);
            }
        };

        initSettings();

        const unsubscribe = onSnapshot(
            settingsRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as SystemSettings);
                }
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching settings:", err);
                setError(err.message || "Failed to load settings");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const updateSettings = async (newSettings: Partial<SystemSettings>) => {
        setSaving(true);
        setError(null);
        try {
            const settingsRef = doc(db, 'system', 'settings');
            // We use setDoc with merge to update only specific fields
            await setDoc(settingsRef, newSettings, { merge: true });
        } catch (err: any) {
            console.error("Error updating settings:", err);
            setError(err.message || 'Failed to update settings');
            throw err;
        } finally {
            setSaving(false);
        }
    };

    return { settings, loading, error, saving, updateSettings };
}
