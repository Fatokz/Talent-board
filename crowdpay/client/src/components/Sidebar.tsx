import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Bell, Users, BookOpen, LogOut, X, User as UserIcon, Store, Package, ArrowRightLeft, PlusCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserInvites, subscribeToVendorProfile } from '../lib/db'
import Logo from '../assets/crowdpayplain.png'
import MerchantOnboardingModal from './MerchantOnboardingModal'

interface SidebarProps { isOpen: boolean; onClose: () => void }

function SidebarContent({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate()
    const { currentUser, userProfile, signOut, switchRole } = useAuth()
    const [notifCount, setNotifCount] = useState(0)
    const [vendorName, setVendorName] = useState<string>('')
    const [switching, setSwitching] = useState(false)
    const [showRoleSelect, setShowRoleSelect] = useState(false)
    const [onboardingModal, setOnboardingModal] = useState(false)

    // Real-time pending invite count for the badge
    useEffect(() => {
        if (!currentUser?.email) return
        const unsub = subscribeToUserInvites(currentUser.email, (invites) => {
            setNotifCount(invites.filter(i => i.status === 'pending').length)
        })
        return unsub
    }, [currentUser])

    useEffect(() => {
        if (!userProfile?.vendorId) return
        return subscribeToVendorProfile(userProfile.vendorId, (v: any) => {
            if (v) setVendorName(v.name)
        })
    }, [userProfile?.vendorId])

    const currentRole = userProfile?.currentRole || 'user'

    const navItems = [
        { to: '/dashboard/', icon: LayoutDashboard, label: 'Social Dashboard', end: true, badge: undefined as number | undefined },
        { to: '/dashboard/profile', icon: UserIcon, label: 'Profile & KYC', badge: undefined as number | undefined },
        { to: '/dashboard/marketplace', icon: Store, label: 'Marketplace', badge: undefined as number | undefined },
        { to: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: notifCount > 0 ? notifCount : undefined },
        { to: '/dashboard/groups', icon: Users, label: 'Group Management', badge: undefined as number | undefined },
        { to: '/dashboard/ledger', icon: BookOpen, label: 'Transaction Ledger', badge: undefined as number | undefined },
    ]

    const filteredNav = navItems // No filtering needed in Personal sidebar anymore

    const handleSwitch = async () => {
        if (!currentUser) return
        setSwitching(true)
        try {
            const isVendor = userProfile?.roles?.includes('vendor')
            if (!isVendor) {
                setOnboardingModal(true)
                setSwitching(false)
                return
            } else {
                const nextRole = currentRole === 'user' ? 'vendor' : 'user'
                await switchRole(nextRole)
                navigate(nextRole === 'user' ? '/dashboard' : '/dashboard/vendor')
            }
            onClose()
        } catch (err) {
            console.error('Switch error:', err)
        } finally {
            setSwitching(false)
        }
    }

    const handleSignOut = async () => {
        try { await signOut(); navigate('/signin') } catch (err) { console.error(err) }
    }

    return (
        <div className="w-64 h-screen flex flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-blue-900 relative overflow-hidden">
            {/* Glow orbs */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 -left-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            <div className="relative px-6 pt-7 pb-6 border-b border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tight">
                        Crowd<span className="text-emerald-400">Pay</span>
                    </span>
                </div>
                <button onClick={onClose} className="lg:hidden w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center">
                    <X size={15} className="text-white/60" />
                </button>
            </div>

            {/* Nav */}
            <nav className="relative flex-1 px-4 py-4 overflow-y-auto">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em] px-2 mb-2.5">Main Menu</p>
                <div className="flex flex-col gap-1">
                    {filteredNav.map(item => (
                        <NavLink key={item.to + item.label} to={item.to} end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${isActive
                                    ? 'bg-white/12 border border-white/15 shadow-inner shadow-black/20'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`
                            }>
                            {({ isActive }) => (
                                <>
                                    <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-gradient-to-br from-blue-700 to-blue-600 shadow-lg' : 'bg-white/7'}`}>
                                        <item.icon size={17} className={isActive ? 'text-white' : 'text-white/45'} />
                                        {/* Dot badge on icon */}
                                        {item.badge && !isActive && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-black text-white">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`flex-1 text-[13px] font-${isActive ? 'bold' : 'medium'} ${isActive ? 'text-white' : 'text-white/50'}`}>
                                        {item.label}
                                    </span>
                                    {/* Count badge on right */}
                                    {item.badge && (
                                        <span className="text-[10px] font-black bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center shadow-lg shadow-red-500/20">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

            </nav>

            {/* Stats + User + signout */}
            <div className="relative px-5 pb-5 pt-4 border-t border-white/8 bg-white/2 backdrop-blur-md">
                
                {/* Integrated Role Switcher (Professional Dropdown) */}
                {currentUser && (
                    <div className="mb-4 relative">
                        {/* Dropdown Menu */}
                        {showRoleSelect && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className="px-5 py-3 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 bg-white/2">Switch Account Profile</p>
                                
                                <button 
                                    disabled={switching}
                                    onClick={() => {
                                        if (currentRole !== 'user') handleSwitch();
                                        setShowRoleSelect(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left disabled:opacity-50 ${currentRole === 'user' ? 'bg-blue-600/10' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentRole === 'user' ? 'bg-blue-600 shadow-lg' : 'bg-white/10'}`}>
                                        <UserIcon size={14} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-white uppercase">Personal Profile</p>
                                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-tight">{currentUser.displayName || 'CrowdPay User'}</p>
                                    </div>
                                    {currentRole === 'user' && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                </button>

                                {userProfile?.roles?.includes('vendor') ? (
                                    <button 
                                        disabled={switching}
                                        onClick={() => {
                                            if (currentRole !== 'vendor') handleSwitch();
                                            setShowRoleSelect(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left border-t border-white/5 disabled:opacity-50 ${currentRole === 'vendor' ? 'bg-emerald-600/10' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentRole === 'vendor' ? 'bg-emerald-600 shadow-lg' : 'bg-white/10'}`}>
                                            <Store size={14} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-white uppercase">{vendorName || 'Business Profile'}</p>
                                            <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest">Merchant Center</p>
                                        </div>
                                        {currentRole === 'vendor' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => { handleSwitch(); setShowRoleSelect(false); }}
                                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left border-t border-white/5"
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                                            <PlusCircle size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-white uppercase tracking-tight">Become a Merchant</p>
                                            <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest">Start Selling</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}

                        <button 
                            onClick={() => setShowRoleSelect(!showRoleSelect)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
                                    currentRole === 'vendor' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/20'
                                }`}>
                                    {currentRole === 'vendor' ? <Store size={18} className="text-white" /> : <UserIcon size={18} className="text-white" />}
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-black text-white uppercase tracking-tight">Active Profile</p>
                                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                                        {currentRole === 'vendor' ? (vendorName || 'Merchant') : 'Personal'}
                                    </p>
                                </div>
                            </div>
                            <ArrowRightLeft size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3 bg-white/7 border border-white/10 rounded-2xl px-4 py-3 mb-3 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/30 shrink-0 capitalize group-hover:scale-105 transition-transform">
                        {currentUser?.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-[13px] truncate capitalize">{currentUser?.displayName || 'User'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">Early Access</p>
                        </div>
                    </div>
                </div>

                <button onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[11px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95">
                    <LogOut size={14} /> Sign out
                </button>
            </div>

            {/* Merchant Onboarding Modal Overlay */}
            {currentUser && (
                <MerchantOnboardingModal 
                    isOpen={onboardingModal}
                    onClose={() => setOnboardingModal(false)}
                    uid={currentUser.uid}
                />
            )}
        </div>
    )
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <>
            <div className="hidden lg:flex shrink-0">
                <SidebarContent onClose={onClose} />
            </div>
            <div className={`lg:hidden fixed inset-0 z-50 flex transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <div className={`relative z-10 h-full transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent onClose={onClose} />
                </div>
            </div>
        </>
    )
}
