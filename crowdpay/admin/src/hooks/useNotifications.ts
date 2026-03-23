import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AdminNotification {
    id: string;
    type: 'new_user' | 'new_jar' | 'withdrawal';
    title: string;
    description: string;
    createdAt: number;
    read: boolean;
    link: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query last 10 users and 10 jars
        const usersRef = collection(db, 'users');
        const jarsRef = collection(db, 'jars');
        
        // Wait for both to be fully resolved, but for real-time we use onSnapshot
        let usersData: AdminNotification[] = [];
        let jarsData: AdminNotification[] = [];

        const updateState = () => {
            const merged = [...usersData, ...jarsData].sort((a, b) => b.createdAt - a.createdAt);
            const top5 = merged.slice(0, 5);
            setNotifications(top5);

            // Assume anything within the last 2 days is unread for demo purposes
            const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);
            setUnreadCount(top5.filter(n => n.createdAt > twoDaysAgo).length);
            setLoading(false);
        };

        const qUsers = query(usersRef, orderBy('createdAt', 'desc'), limit(5));
        const usersUnsub = onSnapshot(qUsers, (snap) => {
            usersData = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: `usr_${doc.id}`,
                    type: 'new_user',
                    title: 'New User Registration',
                    description: `${data.fullName || 'A new user'} joined the platform.`,
                    createdAt: data.createdAt || Date.now(),
                    read: false,
                    link: '/users'
                };
            });
            updateState();
        }, (err) => {
            console.error("Users alert error", err);
        });

        const qJars = query(jarsRef, orderBy('createdAt', 'desc'), limit(5));
        const jarsUnsub = onSnapshot(qJars, (snap) => {
            jarsData = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: `jar_${doc.id}`,
                    type: 'new_jar',
                    title: 'New Jar Created',
                    description: `The "${data.name || 'Unnamed'}" jar was just started.`,
                    createdAt: data.createdAt || Date.now(),
                    read: false,
                    link: '/groups'
                };
            });
            updateState();
        }, (err) => {
            console.error("Jars alert error", err);
        });

        return () => {
            usersUnsub();
            jarsUnsub();
        };
    }, []);

    const markAllAsRead = () => {
        setUnreadCount(0);
    };

    return { notifications, unreadCount, loading, markAllAsRead };
}
