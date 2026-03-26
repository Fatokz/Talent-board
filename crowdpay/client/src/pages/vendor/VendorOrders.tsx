import { useState, useEffect } from 'react'
import { 
    Menu, ShoppingCart
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { 
    subscribeToVendorProfile, VendorProfile, 
    subscribeToVendorOrders, Order,
    updateOrderStatus
} from '../../lib/db'
import toast from 'react-hot-toast'

interface Props { onMenuClick?: () => void }

export default function VendorOrders({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

    useEffect(() => {
        if (!currentUser?.uid) return
        
        const unsubProfile = subscribeToVendorProfile(currentUser.uid, (data) => {
            setVendorData(data)
        })

        const unsubOrders = subscribeToVendorOrders(currentUser.uid, (data) => {
            setOrders(data)
        })

        return () => {
            unsubProfile()
            unsubOrders()
        }
    }, [currentUser])

    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'pending') return o.status === 'pending';
        return o.status === 'completed' || o.status === 'delivered';
    })

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-100 px-4 sm:px-6 h-[68px] flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors">
                        <Menu size={18} className="text-slate-600" />
                    </button>
                    <div className="min-w-0 pr-2">
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight uppercase truncate">
                            Order History
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1 truncate">{vendorData?.name || 'Loading...'}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                {/* Orders Block */}
                <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-sm">
                    {/* Filters */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                        <button 
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            All Orders ({orders.length})
                        </button>
                        <button 
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors ${filter === 'pending' ? 'bg-amber-100 text-amber-900 shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            Pending ({orders.filter(o => o.status === 'pending').length})
                        </button>
                        <button 
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors ${filter === 'completed' ? 'bg-emerald-100 text-emerald-900 shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            Completed ({orders.filter(o => o.status === 'completed' || o.status === 'delivered').length})
                        </button>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                            <div key={order.id} className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-3xl hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm group">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-1">
                                    <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 sm:mb-2">
                                        <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{order.buyerName}</p>
                                        <span className="text-[10px] font-medium text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mb-1">{order.productName}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                            <span className="text-[13px] sm:text-sm font-black text-slate-900">₦{order.amount.toLocaleString()}</span>
                                            {order.status !== 'completed' && order.status !== 'delivered' && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateOrderStatus(order.id, 'completed');
                                                        toast.success('Order marked as completed');
                                                    }}
                                                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                                >
                                                    Mark Done
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center">
                                <ShoppingCart size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No orders found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
