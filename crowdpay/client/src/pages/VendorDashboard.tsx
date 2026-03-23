import { useState, useEffect } from 'react'
import { 
    LayoutDashboard, Package, MessageSquare, TrendingUp, 
    Plus, Search, Store, Users, ArrowUpRight, DollarSign,
    ShieldCheck, Clock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { mockProducts } from '../data/mockData'
import { subscribeToVendorProfile, VendorProfile } from '../lib/db'

interface Props { onMenuClick?: () => void }

export default function VendorDashboard({ onMenuClick }: Props) {
    const { currentUser, userProfile } = useAuth()
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)
    const [stats] = useState({
        totalSales: 1250000,
        activeJars: 8,
        pendingOrders: 3,
        rating: 4.8
    })

    useEffect(() => {
        if (!currentUser?.uid) return
        return subscribeToVendorProfile(currentUser.uid, (data) => {
            setVendorData(data)
        })
    }, [currentUser])

    const myProducts = mockProducts.filter(p => p.vendorId === currentUser?.uid || p.vendorId === 'v1') // Mocking v1 for demo

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-100 px-6 h-[68px] flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Store size={17} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight uppercase">
                            Merchant Hub
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">Vendor Dashboard</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                        <ShieldCheck size={12} /> Live
                    </div>
                    <button className="h-10 px-5 rounded-xl bg-blue-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
                        <Plus size={16} /> Add Product
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Earnings', value: `₦${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Active Jars', value: stats.activeJars, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Merchant Rating', value: stats.rating, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4`}>
                                <stat.icon size={20} />
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                                <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Products List */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Product Inventory</h2>
                            <button className="text-[11px] font-bold text-blue-900 hover:underline">View All</button>
                        </div>
                        
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {myProducts.length > 0 ? myProducts.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={p.image} className="w-10 h-10 rounded-xl object-cover border border-slate-100" />
                                                    <span className="text-sm font-bold text-slate-900">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{p.category}</td>
                                            <td className="px-6 py-4 text-sm font-black text-slate-900">₦{p.price.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">Active</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <Package size={40} className="mx-auto text-slate-200 mb-4" />
                                                <p className="text-sm font-bold text-slate-400">No products added yet.</p>
                                                <button className="mt-4 text-xs font-bold text-blue-900 hover:underline">Create your first product</button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Active Inquiries / Chats */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Recent Inquiries</h2>
                            <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
                            {[
                                { name: 'Sarah Adebayo', msg: 'Is the MacBook Air still available?', time: '2m ago' },
                                { name: 'Chidi James', msg: 'Interested in the corporate gala setup.', time: '1h ago' },
                                { name: 'Amina Musa', msg: 'What is the delivery timeline?', time: '3h ago' },
                            ].map((chat, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer group">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className="text-xs font-black text-slate-900 truncate">{chat.name}</p>
                                            <span className="text-[10px] font-medium text-slate-400">{chat.time}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium truncate group-hover:text-slate-700">{chat.msg}</p>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-3 rounded-2xl bg-slate-50 text-slate-500 text-xs font-bold hover:bg-blue-50 hover:text-blue-900 transition-colors uppercase tracking-widest mt-2">
                                Go to Message Center
                            </button>
                        </div>

                        {/* Store Verification status */}
                        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                            <div className="relative z-10">
                                <h3 className="text-sm font-black mb-2 uppercase tracking-tight">Verification Status</h3>
                                <p className="text-xs text-blue-100/70 font-medium leading-relaxed mb-4">Your store is currently in "Draft" mode. Finish your KYC to start accepting automated jar payouts.</p>
                                <button className="w-full py-3 rounded-2xl bg-white text-blue-900 text-xs font-black hover:bg-blue-50 transition-colors shadow-lg">
                                    Complete Vendor KYC
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
