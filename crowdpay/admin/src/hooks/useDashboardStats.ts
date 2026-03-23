import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DashboardStats {
    totalUsers: number;
    activeJars: number;
    pendingRequests: number;
    loading: boolean;
    error: string | null;
}

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeJars: 0,
        pendingRequests: 0,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                // Fetch Total Users
                const usersSnap = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnap.size;

                // Fetch Active Jars
                const jarsQuery = query(collection(db, 'jars'), where('status', '==', 'active'));
                const jarsSnap = await getDocs(jarsQuery);
                const activeJars = jarsSnap.size;

                // Fetch Pending Withdrawal Requests (serving as "Disputes/Alerts" placeholder)
                const requestsQuery = query(collection(db, 'withdrawalRequests'), where('status', '==', 'pending'));
                const requestsSnap = await getDocs(requestsQuery);
                const pendingRequests = requestsSnap.size;

                if (isMounted) {
                    setStats({
                        totalUsers,
                        activeJars,
                        pendingRequests,
                        loading: false,
                        error: null,
                    });
                }
            } catch (error: any) {
                console.error("Error fetching dashboard stats:", error);
                if (isMounted) {
                    setStats(prev => ({
                        ...prev,
                        loading: false,
                        error: error.message || 'Failed to load stats'
                    }));
                }
            }
        };

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, []);

    return stats;
}
