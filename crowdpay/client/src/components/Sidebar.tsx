import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Bell, Users, BookOpen, LogOut, X, User as UserIcon, Store, Package, ArrowRightLeft, PlusCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserInvites, createVendorProfile } from '../lib/db'
import Logo from '../assets/crowdpayplain.png'

interface SidebarProps { isOpen: boolean; onClose: () => void }

function SidebarContent({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate()
    const { currentUser, userProfile, signOut, switchRole } = useAuth()
    const [notifCount, setNotifCount] = useState(0)
    const [switching, setSwitching] = useState(false)

    // Real-time pending invite count for the badge
    useEffect(() => {
        if (!currentUser?.email) return
        const unsub = subscribeToUserInvites(currentUser.email, (invites) => {
            setNotifCount(invites.filter(i => i.status === 'pending').length)
        })
        return unsub
    }, [currentUser])

    const currentRole = userProfile?.currentRole || 'user'

    const navItems = [
        { to: '/dashboard/', icon: LayoutDashboard, label: 'Social Dashboard', end: true, badge: undefined as number | undefined, roles: ['user'] },
        { to: '/dashboard/profile', icon: UserIcon, label: 'Profile & KYC', badge: undefined as number | undefined, roles: ['user', 'vendor'] },
        { to: '/dashboard/marketplace', icon: Store, label: 'Marketplace', badge: undefined as number | undefined, roles: ['user'] },
        { to: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: notifCount > 0 ? notifCount : undefined, roles: ['user', 'vendor'] },
        { to: '/dashboard/groups', icon: Users, label: 'Group Management', badge: undefined as number | undefined, roles: ['user'] },
        { to: '/dashboard/ledger', icon: BookOpen, label: 'Transaction Ledger', badge: undefined as number | undefined, roles: ['user'] },
        
        // Vendor ONLY items
        { to: '/dashboard/vendor', icon: LayoutDashboard, label: 'Merchant Dashboard', end: true, badge: undefined as number | undefined, roles: ['vendor'] },
        { to: '/dashboard/vendor/products', icon: Package, label: 'Product Inventory', badge: undefined as number | undefined, roles: ['vendor'] },
    ]

    const filteredNav = navItems.filter(item => item.roles.includes(currentRole))

    const handleSwitch = async () => {
        if (!currentUser) return
        setSwitching(true)
        try {
            const isVendor = userProfile?.roles?.includes('vendor')
            if (!isVendor) {
                // Flow to become a vendor
                const businessName = prompt('Enter your Business Name:')
                if (!businessName) {
                    setSwitching(false)
                    return
                }
                const category = prompt('Enter Business Category (e.g. Electronics, Fashion):')
                await createVendorProfile(currentUser.uid, {
                    name: businessName,
                    category: category || 'General',
                    description: `Verified merchant profile for ${businessName}`,
                    bankName: '',
                    accountNumber: '',
                    accountName: ''
                });
                // Note: the createVendorProfile helper in db.ts handles adding 'vendor' to roles
                navigate('/dashboard/vendor')
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

                {/* Switch Role Button */}
                {(userProfile?.roles?.includes('vendor') || userProfile?.kycStatus === 'verified') && (
                    <div className="mt-8 px-2">
                        <button 
                            onClick={handleSwitch}
                            disabled={switching}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {switching ? 'Switching...' : currentRole === 'user' ? 'Switch to Merchant' : 'Switch to Personal'}
                        </button>
                    </div>
                )}
            </nav>

            {/* Stats + User + signout */}
            <div className="relative px-5 pb-5 pt-4 border-t border-white/8 bg-white/2 backdrop-blur-md">
                
                {/* Profile Switcher Card */}
                {currentUser && (
                    <div className="mb-4">
                        <button 
                            onClick={handleSwitch}
                            disabled={switching}
                            className={`w-full group relative overflow-hidden p-3.5 rounded-2xl border transition-all text-left shadow-lg ${
                                userProfile?.roles?.includes('vendor') 
                                ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                                : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${userProfile?.roles?.includes('vendor') ? 'text-white/30' : 'text-emerald-400'}`}>
                                    {userProfile?.roles?.includes('vendor') ? 'Active Profile' : 'Merchant Center'}
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                    !userProfile?.roles?.includes('vendor') ? 'bg-emerald-400' :
                                    currentRole === 'user' ? 'bg-blue-400' : 'bg-emerald-400'
                                }`} />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
                                    !userProfile?.roles?.includes('vendor') ? 'bg-emerald-600 text-white shadow-emerald-500/20' :
                                    currentRole === 'user' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-emerald-600 text-white shadow-emerald-500/20'
                                }`}>
                                    {!userProfile?.roles?.includes('vendor') ? <PlusCircle size={18} /> : 
                                     currentRole === 'user' ? <UserIcon size={18} /> : <Store size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-white truncate uppercase tracking-tight">
                                        {!userProfile?.roles?.includes('vendor') ? 'Become a Merchant' :
                                         currentRole === 'user' ? 'Personal' : 'Merchant'}
                                    </p>
                                    <p className="text-[9px] text-white/30 font-bold flex items-center gap-1.5 mt-0.5 group-hover:text-white/60 transition-colors uppercase tracking-[0.1em]">
                                        {!userProfile?.roles?.includes('vendor') ? 'Upgrade account' :
                                         <><ArrowRightLeft size={9} /> {switching ? 'Switching...' : `Go to ${currentRole === 'user' ? 'Merchant' : 'Personal'}`}</>}
                                    </p>
                                </div>
                            </div>
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
