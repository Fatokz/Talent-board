import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
    LayoutDashboard, Package, ShoppingBag, DollarSign, Settings, 
    LogOut, Store, ArrowLeftRight, Bell, ShieldCheck, ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToVendorOrders } from '../lib/db'
import Logo from '../assets/crowdpayplain.png'

interface SidebarProps { isOpen: boolean; onClose: () => void }

export default function VendorSidebar({ isOpen, onClose }: SidebarProps) {
    const navigate = useNavigate()
    const { currentUser, userProfile, signOut, switchRole } = useAuth()
    const [pendingOrders, setPendingOrders] = useState(0)

    useEffect(() => {
        if (!currentUser?.uid) return
        return subscribeToVendorOrders(currentUser.uid, (orders) => {
            setPendingOrders(orders.filter(o => o.status === 'pending').length)
        })
    }, [currentUser])

    const handleSwitch = async () => {
        await switchRole('user')
        navigate('/dashboard')
        onClose()
    }

    const navItems = [
        { to: '/dashboard/vendor', icon: LayoutDashboard, label: 'Merchant Hub', end: true },
        { to: '/dashboard/vendor/products', icon: Package, label: 'Product Inventory' },
        { to: '/dashboard/vendor/orders', icon: ShoppingBag, label: 'Orders', badge: pendingOrders > 0 ? pendingOrders : undefined },
        { to: '/dashboard/vendor/payouts', icon: DollarSign, label: 'Earnings & Payouts' },
        { to: '/dashboard/vendor/settings', icon: Settings, label: 'Merchant Settings' },
    ]

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#020617] transform transition-transform duration-500 ease-soft-out border-r border-white/5 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-8 pb-4">
                    <img src={Logo} alt="CrowdPay" className="h-8 brightness-0 invert opacity-90 mb-8" />
                    
                    <div className="flex items-center gap-3 p-4 rounded-3xl bg-blue-600 shadow-xl shadow-blue-600/20 border border-blue-400/20">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <Store size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest leading-none mb-1">Active Profile</p>
                            <p className="text-sm font-black text-white truncate max-w-[140px]">Merchant Hub</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={onClose}
                            className={({ isActive }) => `
                                group flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300
                                ${isActive 
                                    ? 'bg-white/5 text-white border border-white/10 shadow-lg' 
                                    : 'text-white/40 hover:text-white hover:bg-white/2'}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                    'group-hover:scale-110'
                                }`}>
                                    <item.icon size={18} />
                                </div>
                                <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-lg shadow-blue-600/20">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Profile */}
                <div className="p-6 mt-auto space-y-4">
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="relative flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <ShieldCheck size={20} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-white truncate tracking-tight">{userProfile?.fullName}</p>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Verified Vendor</p>
                            </div>
                        </div>

                        <button 
                            onClick={handleSwitch}
                            className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group/btn"
                        >
                            <div className="flex items-center gap-2">
                                <ArrowLeftRight size={14} className="text-blue-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Switch to Personal</span>
                            </div>
                            <ChevronRight size={14} className="text-white/40 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <button 
                        onClick={() => signOut()}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[11px] font-black uppercase tracking-widest hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-95"
                    >
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            </div>
        </aside>
    )
}
