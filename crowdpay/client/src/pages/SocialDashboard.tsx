import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    Bell, Search, Plus, TrendingUp, Users, Target, Award,
    Clock, Lock, ChevronRight, AlertCircle, LayoutDashboard,
    RefreshCcw, Gift, HeartHandshake, GraduationCap, Building2, Menu,
    Wallet, ArrowDownToLine, ArrowUpRight, Eye, EyeOff, Loader2, Store
} from 'lucide-react'
import { jarTemplates } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserJars, subscribeToUserInvites, subscribeToUserDoc, Jar, UserProfile } from '../lib/db'
import VotingModal from '../components/VotingModal'
import KycBlockerModal from '../components/KycBlockerModal'
import CreateJarModal from '../components/CreateJarModal'
import WithdrawalRequestModal from '../components/WithdrawalRequestModal'
import FundJarModal from '../components/FundJarModal'
import WithdrawWalletModal from '../components/WithdrawWalletModal'
import FundWalletModal from '../components/FundWalletModal'
import { JarTemplate, VotingModalState } from '../types'


const jarMeta: Record<string, { icon: React.ElementType; grad: string; text: string; tag: string }> = {
    Traditional: { icon: RefreshCcw, grad: 'from-blue-900 to-blue-700', text: 'text-blue-800', tag: 'bg-blue-100 text-blue-800' },
    Celebration: { icon: Gift, grad: 'from-emerald-700 to-emerald-500', text: 'text-emerald-700', tag: 'bg-emerald-100 text-emerald-800' },
    Community: { icon: HeartHandshake, grad: 'from-indigo-700 to-indigo-500', text: 'text-indigo-700', tag: 'bg-indigo-100 text-indigo-700' },
    Education: { icon: GraduationCap, grad: 'from-amber-600 to-amber-400', text: 'text-amber-700', tag: 'bg-amber-100 text-amber-800' },
    Investment: { icon: Building2, grad: 'from-pink-700 to-pink-500', text: 'text-pink-700', tag: 'bg-pink-100 text-pink-800' },
}

function fmtMoney(n: number) {
    return n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M` : `₦${n.toLocaleString()}`
}

function JarCard({ jar, onWithdraw, onActivate, onContribute }: { jar: JarTemplate; onWithdraw?: (j: JarTemplate) => void; onActivate?: (j: JarTemplate) => void; onContribute?: (j: JarTemplate) => void }) {
    const pct = jar.goal > 0 ? Math.min(Math.round((jar.raised / jar.goal) * 100), 100) : 0
    const m = jarMeta[jar.category] || jarMeta.Traditional
    const Icon = m.icon

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${m.grad}`} />
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.grad} flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-900 text-[14px] tracking-tight truncate mb-1">{jar.name}</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${m.tag}`}>{jar.category}</span>
                    </div>
                    {jar.goalReached && (
                        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full shrink-0">
                            <Award size={11} /> Goal!
                        </div>
                    )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{jar.description}</p>
                
                {/* Only show requirement for ACTIVE jars (string IDs) */}
                {typeof jar.id === 'string' && jar.contributionAmount && jar.contributionAmount > 0 && (
                    <div className="flex items-center gap-2 mb-4 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <Wallet size={14} className="text-emerald-600" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Requirement:</span>
                        <span className="text-xs font-black text-slate-900">{fmtMoney(jar.contributionAmount)} <span className="text-[10px] font-medium text-slate-400">/ cycle</span></span>
                    </div>
                )}

                {/* Progress */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400">Raised</span>
                        <span className="font-black text-slate-900">{fmtMoney(jar.raised)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${jar.goalReached ? 'from-emerald-500 to-emerald-400' : m.grad} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] mt-1.5">
                        <span className={`font-bold ${m.text}`}>{pct}% funded</span>
                        <span className="text-slate-400">Goal: {fmtMoney(jar.goal)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400"><Users size={11} /> {jar.members}</span>
                        {jar.daysLeft > 0 && <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock size={11} /> {jar.daysLeft}d</span>}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium"><Lock size={10} /> Unanimous</span>
                </div>

                {jar.goalReached && onWithdraw && (
                    <button onClick={() => onWithdraw(jar)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[13px] font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all">
                        Request Withdrawal <ChevronRight size={14} />
                    </button>
                )}

                {/* Contribute CTA for active jars not yet reached goal */}
                {!jar.goalReached && typeof jar.id === 'string' && onContribute && (
                    <button onClick={() => onContribute(jar)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[13px] font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all">
                        Contribute <ChevronRight size={14} />
                    </button>
                )}

                {/* Activate CTA for templates */}
                {!jar.goalReached && typeof jar.id === 'number' && onActivate && (
                    <button onClick={() => onActivate(jar)}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-blue-700 text-[13px] font-bold py-3 rounded-2xl transition-all">
                        Use Template <ChevronRight size={14} className="text-blue-500" />
                    </button>
                )}
            </div>
        </div>
    )
}

interface Props { onMenuClick?: () => void }

export default function SocialDashboard({ onMenuClick }: Props) {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { currentUser } = useAuth()
    const [kycProfile, setKycProfile] = useState<UserProfile | null>(null)
    const [kycModalOpen, setKycModalOpen] = useState(false)
    const [modal, setModal] = useState<VotingModalState>({ isOpen: false })
    const [newJarModal, setNewJarModal] = useState(false)
    const [templateName, setTemplateName] = useState('')
    const [search, setSearch] = useState('')
    const [realJars, setRealJars] = useState<Jar[]>([])
    const [loadingJars, setLoadingJars] = useState(true)
    const [withdrawalJar, setWithdrawalJar] = useState<JarTemplate | null>(null)
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
    const [fundWalletModalOpen, setFundWalletModalOpen] = useState(false)
    const [fundingJar, setFundingJar] = useState<JarTemplate | null>(null)
    const [showBalance, setShowBalance] = useState(false)

    // Capture Interswitch Funding Redirect
    useEffect(() => {
        const type = searchParams.get('type');
        const jarId = searchParams.get('jarId');
        const txnRef = searchParams.get('txnref') || searchParams.get('wallet_funded');
        const amount = searchParams.get('amount');
        
        if (txnRef && amount && currentUser?.uid) {
            setSearchParams(new URLSearchParams()); // clear url immediately
            
            const endpoint = type === 'jar' ? '/api/verify-payment' : '/api/wallet-funding?action=verify';
            
            const loadId = toast.loading('Finalizing payment verification...');
            
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txnRef, amount, uid: currentUser.uid, jarId })
            }).then(res => res.json()).then(data => {
                toast.dismiss(loadId);
                if (data.success) {
                    toast.success(data.message || 'Payment verified successfully!');
                } else {
                    toast.error(data.message || 'Payment verification failed.');
                }
            }).catch(e => {
                console.error(e);
                toast.error('Network error during verification.');
            })
        }
    }, [searchParams, currentUser, setSearchParams])

    useEffect(() => {
        if (!currentUser) return;
        setLoadingJars(true);
        const unsubscribe = subscribeToUserJars(currentUser.uid, (jars) => {
            setRealJars(jars);
            setLoadingJars(false);
        });
        const unsubKyc = subscribeToUserDoc(currentUser.uid, setKycProfile);
        return () => { unsubscribe(); unsubKyc(); };
    }, [currentUser]);

    const requireKyc = (action: () => void) => {
        if (kycProfile?.kycStatus !== 'verified') {
            setKycModalOpen(true);
        } else {
            action();
        }
    };

    const mappedJars: JarTemplate[] = realJars.map(jar => ({
        id: jar.id as any,
        name: jar.name,
        emoji: '💰',
        category: jar.category,
        goal: jar.goal,
        raised: jar.raised,
        members: jar.members.length,
        daysLeft: Math.max(0, (jar.targetDays || 30) - Math.floor((Date.now() - jar.createdAt) / (1000 * 60 * 60 * 24))), 
        governanceModel: 'Unanimous Consensus',
        description: `A ${jar.frequency} ${jar.category} contribution group.`,
        color: 'from-blue-600 to-blue-500',
        goalReached: jar.raised >= jar.goal && jar.goal > 0 && jar.raised > 0 && jar.status !== 'PAYOUT_COMPLETED',
        jarType: jar.jarType,
        contributionAmount: jar.contributionAmount
    }));

    const activeJars = mappedJars;
    const activeCategories = Array.from(new Set(activeJars.map(j => j.category)));
    const defaultJars = jarTemplates.filter(t => !activeCategories.includes(t.category));

    const [notifCount, setNotifCount] = useState(0)

    // Real-time pending invite count for bell badge
    useEffect(() => {
        if (!currentUser?.email) return
        return subscribeToUserInvites(currentUser.email, invites => {
            setNotifCount(invites.filter(i => i.status === 'pending').length)
        })
    }, [currentUser])

    const goalReached = activeJars.find(j => j.goalReached)
    const totalRaised = activeJars.reduce((s, j) => s + j.raised, 0)

    const stats = [
        {
            label: 'Total Jars',
            value: loadingJars ? <Loader2 size={24} className="animate-spin text-slate-400" /> : activeJars.length + defaultJars.length,
            subtext: loadingJars ? '...' : `${activeJars.length} active`,
            icon: LayoutDashboard, grad: 'from-blue-900 to-blue-700'
        },
        { label: 'Total Pooled', value: loadingJars ? <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-lg" /> : fmtMoney(totalRaised), icon: TrendingUp, grad: 'from-emerald-700 to-emerald-500' },
        { label: 'Pending Invites', value: notifCount, icon: Bell, grad: 'from-indigo-700 to-indigo-500' },
        { label: 'Goals Met', value: loadingJars ? '...' : activeJars.filter(j => j.goalReached).length, icon: Target, grad: 'from-amber-600 to-amber-400' },
    ]

    const filteredActive = activeJars.filter(j =>
        j.name.toLowerCase().includes(search.toLowerCase()) ||
        j.category.toLowerCase().includes(search.toLowerCase())
    )

    const filteredDefault = defaultJars.filter(j =>
        j.name.toLowerCase().includes(search.toLowerCase()) ||
        j.category.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Topbar */}
            <div className="bg-white border-b border-slate-100 px-4 sm:px-6 h-[68px] flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <button onClick={onMenuClick} className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Menu size={15} className="text-slate-600 sm:size-[17px]" />
                    </button>
                    <h1 className="text-lg sm:text-xl font-black text-slate-800 hidden md:block mr-2">Dashboard</h1>
                    <div className="relative max-w-sm flex-1">
                        <Search size={13} className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none sm:size-[14px]" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jars…"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 h-9 sm:h-10 rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 text-[13px] sm:text-sm focus:outline-none focus:border-blue-900 focus:bg-white transition-colors" />
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4">
                    <button onClick={() => navigate('/dashboard/notifications')} className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <Bell size={15} className="text-slate-500 sm:size-[17px]" />
                        {notifCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white px-1">
                                {notifCount > 9 ? '9+' : notifCount}
                            </span>
                        )}
                    </button>
                    <button onClick={() => requireKyc(() => setNewJarModal(true))}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white text-[12px] sm:text-sm font-bold shadow-md shadow-blue-900/30 whitespace-nowrap">
                        <Plus size={14} className="sm:size-[15px]" /> New
                    </button>
                </div>
            </div>

            <div className="p-4 sm:p-8">
                {/* Welcome */}
                <div className="mb-5 sm:mb-7">
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
                        Welcome, <span className="bg-gradient-to-r from-blue-900 to-emerald-500 bg-clip-text text-transparent">{kycProfile?.fullName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'Member'}</span>
                    </h1>
                    <p className="text-[11px] sm:text-sm text-slate-500 leading-tight">Your collective wallets are secure. All jars are protected by unanimous consensus.</p>
                </div>

                {/* Dual Role Clause Banner */}
                {kycProfile?.roles?.includes('vendor') && (
                    <div className="mb-7 p-5 rounded-3xl bg-blue-50 border border-blue-100 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                            <Store size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[13px] font-black text-blue-900 tracking-tight leading-none mb-1">Dual-Account Activation</p>
                            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                                You are currently in <span className="font-black uppercase">Personal Mode</span>. To manage your products, view orders, and settle payouts, switch to your <span className="font-black uppercase">Merchant Merchant Profile</span> in the sidebar.
                            </p>
                        </div>
                    </div>
                )}

                {/* Wallet Balance Card */}
                <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 rounded-3xl p-6 sm:p-8 mb-7 shadow-[0_20px_40px_-15px_rgba(30,58,138,0.5)] relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute right-20 -bottom-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet size={16} className="text-blue-300" />
                                <p className="text-sm font-bold text-blue-200 uppercase tracking-widest">My CrowdPay Wallet</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                                    {showBalance ? fmtMoney(kycProfile?.walletBalance || 0) : '₦****'}
                                </h2>
                                <button 
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5"
                                >
                                    {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button onClick={() => requireKyc(() => setFundWalletModalOpen(true))}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-sm transition-all border border-white/10 shadow-inner">
                                <ArrowDownToLine size={16} /> Fund
                            </button>
                            <button onClick={() => requireKyc(() => setWithdrawModalOpen(true))}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/30">
                                Withdraw <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                    {stats.map(s => (
                        <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 flex items-center gap-2 sm:gap-4 shadow-sm">
                            <div className={`w-8 h-8 sm:w-[52px] sm:h-[52px] rounded-xl sm:rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg shrink-0`}>
                                <s.icon size={16} className="sm:size-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] sm:text-sm text-slate-500 font-semibold mb-0.5 truncate">{s.label}</p>
                                <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                                    <div className="text-sm sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{s.value}</div>
                                    {s.subtext && <span className="text-[8px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap">{s.subtext}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Goal Reached banner */}
                {goalReached && (
                    <div className="rounded-2xl mb-7 bg-gradient-to-r from-slate-900 to-blue-900 border border-white/10 p-5 flex items-center gap-5 flex-wrap">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                            <Award size={24} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-48">
                            <span className="text-[10px] font-black bg-amber-400 text-white px-2.5 py-0.5 rounded-md tracking-wider uppercase">Goal Reached</span>
                            <p className="text-white font-black text-base mt-1">{goalReached.goalReachedFor}</p>
                            <p className="text-white/50 text-xs mt-0.5">{fmtMoney(goalReached.raised)} collected · {goalReached.members} contributors · Awaiting unanimous sign-off</p>
                        </div>
                        <button onClick={() => setWithdrawalJar(goalReached)}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-900 text-sm font-black shadow-lg hover:-translate-y-0.5 transition-transform whitespace-nowrap">
                            Request Withdrawal <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {/* Active Jars grid */}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Jars</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Your active contribution groups</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {filteredActive.length} active
                    </div>
                </div>

                {loadingJars ? (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-[280px] bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />)}
                    </div>
                ) : filteredActive.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 mb-8 border-dashed">
                        <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-500 text-sm">No active jars</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                        {filteredActive.map(jar => (
                            <JarCard
                                key={jar.id}
                                jar={jar}
                                onWithdraw={j => setWithdrawalJar(j)}
                                onContribute={j => requireKyc(() => setFundingJar(j))}
                                onActivate={(j) => requireKyc(() => { setTemplateName(j.name); setNewJarModal(true); })}
                            />
                        ))}
                    </div>
                )}

                {/* Default Templates grid */}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Default Templates</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Click any template to create a new jar</p>
                    </div>
                </div>

                {filteredDefault.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <AlertCircle size={32} className="mx-auto mb-2" />
                        <p className="font-bold text-slate-600 text-sm">No templates found</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredDefault.map(jar => (
                            <JarCard
                                key={jar.id}
                                jar={jar}
                                onWithdraw={j => setWithdrawalJar(j)}
                                onActivate={(j) => requireKyc(() => { setTemplateName(j.name); setNewJarModal(true); })}
                            />
                        ))}
                    </div>
                )}
            </div>

            {modal.isOpen && <VotingModal isOpen={modal.isOpen} jar={modal.jar} onClose={() => setModal({ isOpen: false })} />}

            {/* Withdrawal Request Modal — collects bank details + reason → Firestore */}
            {withdrawalJar && (
                <WithdrawalRequestModal
                    isOpen={!!withdrawalJar}
                    onClose={() => setWithdrawalJar(null)}
                    jarId={String(withdrawalJar.id)}
                    jarName={withdrawalJar.name}
                    jarCategory={withdrawalJar.category}
                    amount={withdrawalJar.raised}
                    totalVoters={Math.max(withdrawalJar.members - 1, 0)}
                    jarType={withdrawalJar.jarType}
                    type={withdrawalJar.category === 'Traditional' ? 'ajo_rotation' : 'goal_withdrawal'}
                />
            )}

            {/* Fund Jar Modal - The Interswitch Entry Point */}
            {fundingJar && (
                <FundJarModal
                    isOpen={!!fundingJar}
                    onClose={() => setFundingJar(null)}
                    jar={fundingJar}
                    profile={kycProfile}
                />
            )}

            {/* New Jar Modal */}
            <CreateJarModal
                isOpen={newJarModal}
                initialName={templateName}
                onClose={() => { setNewJarModal(false); setTemplateName(''); }}
                onSuccess={(id) => {
                    console.log('Jar created', id);
                    setTemplateName('');
                }}
            />

            {/* Fund Wallet Modal */}
            <FundWalletModal 
                isOpen={fundWalletModalOpen} 
                onClose={() => setFundWalletModalOpen(false)} 
            />

            {/* Withdraw Wallet Modal */}
            <WithdrawWalletModal 
                isOpen={withdrawModalOpen} 
                onClose={() => setWithdrawModalOpen(false)} 
                profile={kycProfile} 
            />

            {/* KYC Blocker Modal */}
            <KycBlockerModal isOpen={kycModalOpen} onClose={() => setKycModalOpen(false)} />
        </div>
    )
}
