import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Bell, Users, BookOpen, LogOut, X, User as UserIcon, Store, ArrowRightLeft, PlusCircle, MessageSquare
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserInvites, subscribeToVendorProfile, subscribeToUserConversations } from '../lib/db'
import Logo from '../assets/crowdpayplain.png'
import toast from 'react-hot-toast'

interface SidebarProps { 
    isOpen: boolean; 
    onClose: () => void;
    onOpenOnboarding: () => void;
    onOpenMessages: () => void;
    unreadCount: number;
}

function SidebarContent({ onClose, onOpenOnboarding, onOpenMessages, unreadCount }: { onClose: () => void, onOpenOnboarding: () => void, onOpenMessages: () => void, unreadCount: number }) {
    const navigate = useNavigate()
    const { currentUser, userProfile, signOut, switchRole } = useAuth()
    const [notifCount, setNotifCount] = useState(0)
    const [vendorName, setVendorName] = useState<string>('')
    const [switching, setSwitching] = useState(false)
    const [showRoleSelect, setShowRoleSelect] = useState(false)
    const [confirmSignOut, setConfirmSignOut] = useState(false)
    const roleSelectRef = useRef<HTMLDivElement>(null)

    // Click away to close role selector
    useEffect(() => {
        const handleClickAway = (e: MouseEvent) => {
            if (roleSelectRef.current && !roleSelectRef.current.contains(e.target as Node)) {
                setShowRoleSelect(false)
            }
        }
        if (showRoleSelect) {
            document.addEventListener('mousedown', handleClickAway)
        } else {
            document.removeEventListener('mousedown', handleClickAway)
        }
        return () => document.removeEventListener('mousedown', handleClickAway)
    }, [showRoleSelect])

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

    const currentRole = 'user' as string

    const navItems = [
        { to: '/dashboard/', icon: LayoutDashboard, label: 'Social Dashboard', end: true, badge: undefined as number | undefined },
        { to: '/dashboard/profile', icon: UserIcon, label: 'Profile & KYC', badge: undefined as number | undefined },
        { to: '/dashboard/marketplace', icon: Store, label: 'Marketplace', badge: undefined as number | undefined },
        { onClick: onOpenMessages, icon: MessageSquare, label: 'Messages', badge: unreadCount > 0 ? unreadCount : undefined },
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
                onOpenOnboarding()
                setSwitching(false)
                return
            } else {
                const nextRole = 'vendor' as 'user' | 'vendor'
                await switchRole(nextRole)
                navigate('/dashboard/vendor')
                toast.success('🏪 Switched to Merchant Account')
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
        <>
        {/* Full-screen switching overlay */}
        {switching && createPortal(
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md font-sans">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-emerald-400 animate-spin mb-6" />
                <p className="text-white font-black text-lg tracking-tight">Switching profile…</p>
                <p className="text-white/40 text-xs font-medium mt-1">Please wait</p>
            </div>,
            document.body
        )}
        <div className="w-64 h-[100dvh] flex flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-blue-900 relative overflow-hidden custom-scrollbar">
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
                    {filteredNav.map(item => {
                        const content = (
                            <>
                                <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${(item as any).to && location.pathname === (item as any).to ? 'bg-gradient-to-br from-blue-700 to-blue-600 shadow-lg' : 'bg-white/7'}`}>
                                    <item.icon size={17} className={(item as any).to && location.pathname === (item as any).to ? 'text-white' : 'text-white/45'} />
                                    {/* Dot badge on icon */}
                                    {item.badge && !((item as any).to && location.pathname === (item as any).to) && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-black text-white">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className={`flex-1 text-[13px] font-${(item as any).to && location.pathname === (item as any).to ? 'bold' : 'medium'} ${(item as any).to && location.pathname === (item as any).to ? 'text-white' : 'text-white/50'}`}>
                                    {item.label}
                                </span>
                                {/* Count badge on right */}
                                {item.badge && (
                                    <span className="text-[10px] font-black bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center shadow-lg shadow-red-500/20">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </>
                        )

                        if ('to' in item) {
                            return (
                                <NavLink key={(item as any).to + item.label} to={(item as any).to} end={item.end}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${isActive
                                            ? 'bg-white/12 border border-white/15 shadow-inner shadow-black/20'
                                            : 'hover:bg-white/5 border border-transparent'
                                        }`
                                    }>
                                    {content}
                                </NavLink>
                            )
                        }

                        return (
                            <button key={item.label} onClick={() => { item.onClick!(); onClose(); }}
                                className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all hover:bg-white/5 border border-transparent w-full text-left">
                                {content}
                            </button>
                        )
                    })}
                </div>

            </nav>

            {/* Stats + User + signout */}
            <div className="relative px-5 pb-5 pt-4 border-t border-white/8 bg-white/2 backdrop-blur-md">
                
                {/* Integrated Role Switcher (Professional Dropdown) */}
                {currentUser && (
                    <div className="mb-4 relative" ref={roleSelectRef}>
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
                                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-tight">{userProfile?.fullName || currentUser.displayName || 'CrowdPay User'}</p>
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
                                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-0.5">Currently Using</p>
                                    <p className="text-[12px] font-black text-white uppercase tracking-tight">Personal Account</p>
                                </div>
                            </div>
                            <ArrowRightLeft size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3 bg-white/7 border border-white/10 rounded-2xl px-4 py-3 mb-3 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => navigate('/dashboard/profile')}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/30 shrink-0 capitalize group-hover:scale-105 transition-transform">
                        {userProfile?.fullName?.charAt(0) || currentUser?.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-[13px] truncate capitalize">{userProfile?.fullName || currentUser?.displayName || 'User'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">Early Access</p>
                        </div>
                    </div>
                </div>

                <button onClick={() => setConfirmSignOut(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 text-white/90 text-[11px] font-black uppercase tracking-widest hover:text-white hover:bg-white/20 hover:border-white/30 transition-all active:scale-95">
                    <LogOut size={14} /> Sign out
                </button>

                {confirmSignOut && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmSignOut(false)} />
                        <div className="relative bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                             <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                                 <LogOut size={32} className="text-red-500 ml-1" />
                             </div>
                             <h3 className="text-2xl font-black text-slate-900 mb-2 text-center tracking-tight">Sign Out</h3>
                             <p className="text-sm text-slate-500 font-medium mb-8 text-center leading-relaxed">Are you sure you want to log out of your CrowdPay account?</p>
                             <div className="flex flex-col gap-3">
                                 <button onClick={handleSignOut} className="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-[15px] hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95">Yes, sign out</button>
                                 <button onClick={() => setConfirmSignOut(false)} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-700 font-bold text-[15px] hover:bg-slate-100 transition-colors">Cancel</button>
                             </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

        </div>
        </>
    )
}

export default function Sidebar({ isOpen, onClose, onOpenOnboarding, onOpenMessages, unreadCount }: SidebarProps) {
    return (
        <>
            <div className="hidden lg:flex shrink-0">
                <SidebarContent onClose={onClose} onOpenOnboarding={onOpenOnboarding} onOpenMessages={onOpenMessages} unreadCount={unreadCount} />
            </div>
            <div className={`lg:hidden fixed inset-0 z-50 flex transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <div className={`relative z-10 h-full transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent onClose={onClose} onOpenOnboarding={onOpenOnboarding} onOpenMessages={onOpenMessages} unreadCount={unreadCount} />
                </div>
            </div>
        </>
    )
}
