import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getJarById, joinJarDirect, Jar } from '../lib/db';
import { Users, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvitePage() {
    const { jarId } = useParams<{ jarId: string }>();
    const { currentUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [jar, setJar] = useState<Jar | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadJar() {
            if (!jarId) return;
            try {
                const data = await getJarById(jarId);
                if (!data) {
                    setError("This jar doesn't exist or has been deleted.");
                } else {
                    setJar(data);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load jar details. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        loadJar();
    }, [jarId]);

    // Handle Authentication Redirect
    useEffect(() => {
        if (!authLoading && !currentUser && !loading) {
            // Store the current invite path so we can return after sign-in
            const currentPath = window.location.pathname;
            navigate(`/signin?redirect=${currentPath}`);
        }
    }, [currentUser, authLoading, loading, navigate]);

    const handleJoin = async () => {
        if (!currentUser || !jarId) return;
        
        // Already a member?
        if (jar?.members.includes(currentUser.uid)) {
            toast.success("You're already a member of this jar!");
            navigate('/dashboard');
            return;
        }

        setJoining(true);
        try {
            await joinJarDirect(jarId, currentUser.uid);
            toast.success(`Welcome to ${jar?.name}!`);
            // Brief delay for effect
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (err) {
            console.error(err);
            toast.error("Failed to join jar. Please check your connection.");
        } finally {
            setJoining(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-900 animate-spin mb-4" />
                <p className="text-slate-500 font-bold text-sm">Validating Invitation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="text-red-600 w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Invitation Error</h1>
                <p className="text-slate-500 max-w-sm mb-8">{error}</p>
                <button onClick={() => navigate('/')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-50" />

            <div className="relative w-full max-w-lg">
                {/* Logo / Header */}
                <div className="mb-10 text-center animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/5 border border-blue-900/10 text-blue-900 text-[10px] font-black uppercase tracking-widest mb-4">
                        <Users size={12} /> CrowdPay Social Savings
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">You've Been Invited!</h1>
                    <p className="text-slate-500 font-medium">Join your team and start saving together.</p>
                </div>

                {/* Main Card */}
                <div className="group relative bg-white/70 backdrop-blur-xl border border-white rounded-[40px] p-8 shadow-2xl shadow-blue-900/5 animate-fade-in-up duration-700">
                    <div className="absolute -inset-px bg-gradient-to-br from-blue-600/10 to-emerald-500/10 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                        {/* Jar Meta */}
                        <div className="flex items-center gap-6 mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-900/20 shrink-0">
                                <Users size={32} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{jar?.category}</p>
                                <h2 className="text-2xl font-black text-slate-900 truncate mb-0.5">{jar?.name}</h2>
                                <p className="text-xs text-slate-400 font-bold">Goal: <span className="text-slate-900">₦{jar?.goal.toLocaleString()}</span></p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="text-emerald-600 w-3 h-3" />
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    Contribute and save together with other <span className="font-bold text-slate-900">{jar?.members.length} members</span>.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="text-emerald-600 w-3 h-3" />
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    All withdrawals are protected by group consensus and your secure 4-digit PIN.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 active:scale-95 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Users size={16} /> Join the Jar</>}
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-4 text-slate-500 font-bold text-xs hover:text-slate-700 transition-colors"
                            >
                                No thanks, take me home
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" /> Secure Social Savings powered by CrowdPay
                </p>
            </div>
        </div>
    );
}
