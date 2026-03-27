import { useState, useEffect } from 'react'
import { 
    TrendingUp, Menu, Package,
    Plus, Users, DollarSign,
    ShieldCheck, Clock, ShoppingCart, MessageSquare
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { 
    subscribeToVendorProfile, VendorProfile, 
    subscribeToVendorOrders, Order,
    subscribeToVendorProducts, Product,
    subscribeToVendorConversations
} from '../../lib/db'
import AddProductModal from '../../components/AddProductModal'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface Props { onMenuClick?: () => void }

export default function VendorOverview({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [stats, setStats] = useState({
        totalSales: 0,
        activeJars: 0,
        pendingOrders: 0,
        rating: 5.0
    })
    const [orders, setOrders] = useState<Order[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const navigate = useNavigate()

    useEffect(() => {
        if (!currentUser?.uid) return
        
        const unsubProfile = subscribeToVendorProfile(currentUser.uid, (data) => {
            setVendorData(data)
            if (data) setStats(prev => ({ ...prev, rating: data.rating }))
        })

        const unsubOrders = subscribeToVendorOrders(currentUser.uid, (data) => {
            setOrders(data)
            const total = data.reduce((acc, curr) => acc + (curr.status === 'completed' || curr.status === 'delivered' ? curr.amount : 0), 0)
            const pending = data.filter(o => o.status === 'pending').length
            setStats(prev => ({ ...prev, totalSales: total, pendingOrders: pending }))
        })

        const unsubProducts = subscribeToVendorProducts(currentUser.uid, (data) => {
            setProducts(data.filter(p => p.status !== 'deleted'))
        })

        const unsubConvos = subscribeToVendorConversations(currentUser.uid, (convos) => {
            setUnreadCount(convos.reduce((acc, c) => acc + (c.vendorUnread || 0), 0))
        })

        return () => {
            unsubProfile()
            unsubOrders()
            unsubProducts()
            unsubConvos()
        }
    }, [currentUser])

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-100 px-4 sm:px-6 h-[68px] flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Menu size={18} className="text-slate-600" />
                    </button>
                    <div className="min-w-0 pr-2">
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight uppercase truncate">
                            {vendorData?.name || 'Merchant Hub'}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1 truncate">{vendorData?.category || 'Vendor Dashboard'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                        <ShieldCheck size={12} /> Live
                    </div>

                    {/* Messages Icon */}
                    <button
                        onClick={() => navigate('/dashboard/vendor/messages')}
                        className="relative w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-blue-50 hover:text-blue-700 transition-colors shrink-0"
                        title="Messages"
                    >
                        <MessageSquare size={18} className="text-slate-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-9 sm:h-10 px-3 sm:px-5 rounded-xl bg-blue-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap shrink-0"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                {/* Dual Role Clause Banner */}
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-emerald-50 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 animate-in slide-in-from-top-4 duration-500">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                        <Users size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-black text-emerald-900 tracking-tight leading-none mb-1.5 uppercase">Merchant Active Mode</p>
                        <p className="text-[11px] sm:text-xs text-emerald-700 font-medium leading-relaxed max-w-2xl">
                            You are currently managing your <span className="font-black">Business Profile</span>. To contribute to your Ajo jars, view personal savings, or join new groups, switch back to your <span className="font-black">Personal Profile</span> via the sidebar.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-10">
                    {[
                        { label: 'Total Earnings', value: `₦${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Active Jars', value: stats.activeJars, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Merchant Rating', value: stats.rating, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm relative group">
                            <div className={`${stat.bg} ${stat.color} w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4`}>
                                <stat.icon size={16} className="sm:w-5 sm:h-5" />
                            </div>
                            <p className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-1 sm:gap-0">
                                <h3 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate w-full">{stat.value}</h3>
                                {stat.label === 'Total Earnings' && (
                                    <button 
                                        onClick={() => toast.success('Payout integration coming in next phase')}
                                        className="text-[10px] font-black text-blue-900 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors uppercase tracking-widest"
                                    >
                                        Withdraw
                                    </button>
                                )}
                                {stat.label !== 'Total Earnings' && (
                                    <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pb-4 sm:pb-8">
                    {/* Left Column: Product Inventory */}
                    <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">Product Inventory</h2>
                            <Link to="/dashboard/vendor/products" className="text-[11px] sm:text-xs font-black text-blue-600 hover:text-blue-800 transition-colors">
                                View All
                            </Link>
                        </div>
                        
                        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm flex flex-col h-[280px] sm:h-[360px]">
                            {/* Table Header Wrapper for Mobile Scroll */}
                            <div className="overflow-x-auto custom-scrollbar flex-1 flex flex-col">
                                <div className="min-w-[400px] flex-1 flex flex-col">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-4 gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/30 shrink-0">
                                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</span>
                                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</span>
                                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto min-w-[400px]">
                                        {products.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {products.slice(0, 4).map(p => (
                                                    <div key={p.id} className="grid grid-cols-4 gap-4 px-4 sm:px-6 py-3 sm:py-4 items-center hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <img src={p.image} className="w-8 h-8 rounded-lg object-cover border border-slate-100 shrink-0" />
                                                            <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate pr-2">{p.name}</span>
                                                        </div>
                                                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate pr-2">{p.category}</span>
                                                        <span className="text-[11px] sm:text-xs font-black text-slate-900 truncate">₦{p.price.toLocaleString()}</span>
                                                        <div>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                                                                p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                            }`}>
                                                                {p.status === 'active' ? 'Active' : 'Out of Stock'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 py-10">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-300 mb-3 sm:mb-4">
                                                    <Package size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                                                </div>
                                                <p className="text-[13px] sm:text-sm font-bold text-slate-400 mb-2">No products added yet.</p>
                                                <button 
                                                    onClick={() => setIsAddModalOpen(true)}
                                                    className="text-[11px] font-black text-blue-900 hover:text-blue-700 transition-colors"
                                                >
                                                    Create your first product
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Recent Orders & Verification */}
                    <div className="space-y-6 sm:space-y-8">
                        {/* Recent Orders section */}
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">Recent Orders</h2>
                                <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-blue-900/20">
                                    {orders.length}
                                </div>
                            </div>
                            
                            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm flex flex-col h-[280px] sm:h-[300px]">
                                {orders.length > 0 ? (
                                    <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-3 sm:mb-4 custom-scrollbar pr-1 sm:pr-2">
                                        {orders.slice(0, 3).map(o => (
                                            <div key={o.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-100/50 text-blue-600 flex items-center justify-center shrink-0">
                                                        <ShoppingCart size={14} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">{o.buyerName}</p>
                                                        <p className="text-[9px] text-slate-500 font-medium truncate">{o.productName}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 shrink-0">₦{(o.amount || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="text-slate-200 mb-3">
                                            <ShoppingCart size={28} className="sm:w-8 sm:h-8" />
                                        </div>
                                        <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed max-w-[140px]">No Orders Yet</p>
                                    </div>
                                )}
                                
                                <Link to="/dashboard/vendor/orders" className="w-full block mt-auto">
                                    <button className="w-full py-2.5 sm:py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors shrink-0 border border-slate-100 shadow-sm">
                                        View Order History
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* Store Verification status */}
                        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[2rem] p-5 sm:p-6 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                            <div className="relative z-10">
                                <h3 className="text-[12px] sm:text-[13px] font-black mb-1.5 uppercase tracking-tight">Verification Status</h3>
                                <p className="text-[10px] sm:text-[11px] text-blue-100/70 font-medium leading-relaxed mb-4 pt-1">Your store is currently in "Draft" mode. Finish your KYC to start accepting automated jar payouts.</p>
                                <Link to="/dashboard/vendor/kyc" className="block w-full">
                                    <button className="w-full py-2.5 sm:py-3 rounded-xl bg-white text-blue-900 text-[10px] sm:text-[11px] font-black hover:bg-blue-50 transition-colors shadow-lg shadow-white/10 mt-1">
                                        Complete Vendor KYC
                                    </button>
                                </Link>
                            </div>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {currentUser && (
                <AddProductModal 
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    vendorId={currentUser.uid}
                />
            )}
        </div>
    )
}
