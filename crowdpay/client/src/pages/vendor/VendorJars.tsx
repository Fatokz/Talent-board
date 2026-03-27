import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
    Users, TrendingUp, Package, 
    ArrowRight, Search, Menu, X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorJars, Jar, Product, subscribeToVendorProducts, subscribeToJarMembers, subscribeToJarTransactions, UserProfile } from '../../lib/db'
import { Link } from 'react-router-dom'

function JarDetailsModal({ jar, isOpen, onClose }: { jar: Jar, isOpen: boolean, onClose: () => void }) {
    const [members, setMembers] = useState<UserProfile[]>([])
    const [txns, setTxns] = useState<any[]>([])
    const progress = jar.goal > 0 ? (jar.raised / jar.goal) * 100 : 0

    useEffect(() => {
        if (!isOpen) return
        const unsubMembers = subscribeToJarMembers(jar.members, setMembers)
        const unsubTxns = subscribeToJarTransactions(jar.id, setTxns)
        return () => {
            unsubMembers()
            unsubTxns()
        }
    }, [jar.id, isOpen])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider">{jar.jarType}</span>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{jar.name}</h3>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jar Identification: {jar.id}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Progress Card */}
                    <div className="bg-blue-900 rounded-3xl p-6 text-white shadow-lg shadow-blue-900/20">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-1">Savings Progress</p>
                                <p className="text-3xl font-black">₦{jar.raised.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-1">Target Goal</p>
                                <p className="text-xl font-bold opacity-80">₦{jar.goal.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
                            <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, progress)}%` }} />
                        </div>
                        <p className="text-center mt-3 text-xs font-black uppercase tracking-widest text-blue-100">{Math.round(progress)}% of goal reached</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Members */}
                        <div>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Active Members ({members.length})</h4>
                            </div>
                            <div className="space-y-3">
                                {members.map((m, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-hover hover:border-blue-200 group">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-black text-xs uppercase shadow-sm">
                                            {m.fullName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 truncate uppercase">{m.fullName}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{m.uid === jar.createdBy ? 'Creator / Lead' : 'Contributor'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Recent Activity</h4>
                            </div>
                            <div className="space-y-3">
                                {txns.length > 0 ? txns.slice(0, 5).map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <TrendingUp size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 uppercase">Contribution</p>
                                                <p className="text-[8px] font-bold text-slate-400 capitalize">{t.type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-black text-emerald-600">+₦{t.amount.toLocaleString()}</span>
                                    </div>
                                )) : (
                                    <div className="h-32 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">No transactions detected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                    <button onClick={onClose} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                        Close Overview
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}


interface Props { onMenuClick?: () => void }

export default function VendorJars({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [jars, setJars] = useState<Jar[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedJarForDetails, setSelectedJarForDetails] = useState<Jar | null>(null)
    const [creatorProfiles, setCreatorProfiles] = useState<Record<string, UserProfile>>({})

    useEffect(() => {
        if (!currentUser?.uid) return
        
        const unsubJars = subscribeToVendorJars(currentUser.uid, (data) => {
            setJars(data)
            setLoading(false)
        })

        const unsubProducts = subscribeToVendorProducts(currentUser.uid, (data) => {
            setProducts(data)
        })

        return () => {
            unsubJars()
            unsubProducts()
        }
    }, [currentUser])

    useEffect(() => {
        if (jars.length === 0) return
        const uniqueCreatorIds = Array.from(new Set(jars.map(j => j.createdBy)))
        const unsubs = uniqueCreatorIds.map(uid => 
            subscribeToJarMembers([uid], (profiles) => {
                if (profiles.length > 0) {
                    setCreatorProfiles(prev => ({ ...prev, [uid]: profiles[0] }))
                }
            })
        )
        return () => unsubs.forEach(unsub => unsub())
    }, [jars])

    const filteredJars = jars.filter(jar => 
        jar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        jar.productName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Group jars by product
    const jarsByProduct = filteredJars.reduce((acc, jar) => {
        const key = jar.productId || 'unlinked'
        if (!acc[key]) acc[key] = []
        acc[key].push(jar)
        return acc
    }, {} as Record<string, Jar[]>)

    const getProduct = (id: string) => products.find(p => p.id === id)

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-4 sm:px-6 h-[68px] flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Menu size={18} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Product Jars</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">Live Savings Monitoring</p>
                    </div>
                </div>

                <div className="relative hidden sm:block w-64 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text"
                        placeholder="Search jars or products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-900 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                {/* Info Banner */}
                <div className="mb-6 sm:mb-8 p-6 rounded-[2rem] bg-blue-900 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="max-w-xl text-center lg:text-left">
                            <h2 className="text-xl font-black mb-2 uppercase tracking-tight">Active Savings Overview</h2>
                            <p className="text-xs sm:text-sm text-blue-100/80 font-medium leading-relaxed">
                                Monitor users who are currently saving up for your products. Once a jar reaches its goal, payouts are automatically processed to your merchant wallet.
                            </p>
                        </div>
                        <div className="flex flex-row sm:flex-row gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                            <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-white/10 shrink-0 flex-1 min-w-[140px]">
                                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-blue-200 mb-0.5 sm:mb-1">Active Jars</p>
                                <p className="text-lg sm:text-2xl font-black">{jars.length}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-white/10 shrink-0 flex-1 min-w-[160px]">
                                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-blue-200 mb-0.5 sm:mb-1">Est. Revenue</p>
                                <p className="text-lg sm:text-2xl font-black truncate">₦{jars.reduce((acc, j) => acc + (j.goal || 0), 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 bg-white border border-slate-200 rounded-[2rem]" />
                        ))}
                    </div>
                ) : Object.keys(jarsByProduct).length > 0 ? (
                    <div className="space-y-10">
                        {Object.entries(jarsByProduct).map(([productId, productJars]) => {
                            const product = getProduct(productId)
                            return (
                                <div key={productId} className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            {product?.image ? (
                                                <img src={product.image} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 group-hover:text-blue-900 transition-colors uppercase tracking-tight">
                                                    {product?.name || productJars[0]?.productName || 'Unlinked Product'}
                                                </h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{productJars.length} Active Jars</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        {productJars.map(jar => {
                                            const progress = jar.goal > 0 ? (jar.raised / jar.goal) * 100 : 0
                                            return (
                                                <div key={jar.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1 min-w-0 mr-4">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                                    jar.jarType === 'collaborative' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                    {jar.jarType}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                                    BY: {creatorProfiles[jar.createdBy]?.fullName || (jar.createdBy.slice(0, 8))}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-black text-slate-900 truncate uppercase mt-1">{jar.name}</h4>
                                                        </div>
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                            <Users size={18} />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                                            <span className="text-slate-400">Savings Progress</span>
                                                            <span className="text-blue-900 font-black">{Math.round(progress)}%</span>
                                                        </div>
                                                        
                                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                                            <div 
                                                                className={`h-full transition-all duration-1000 ease-out rounded-full shadow-sm ${
                                                                    progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                                                }`}
                                                                style={{ width: `${Math.min(100, progress)}%` }}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between pt-1">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Raised</span>
                                                                <span className="text-[13px] font-black text-slate-900 tabular-nums">₦{jar.raised?.toLocaleString()}</span>
                                                            </div>
                                                            <div className="text-right flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Price</span>
                                                                <span className="text-[13px] font-black text-slate-900 tabular-nums">₦{jar.goal?.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="flex items-center -space-x-2">
                                                            {jar.members.slice(0, 3).map((m, iconIdx) => (
                                                                <div key={iconIdx} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                                                                    {m.charAt(0)}
                                                                </div>
                                                            ))}
                                                            {jar.members.length > 3 && (
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                                                    +{jar.members.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={() => setSelectedJarForDetails(jar)}
                                                            className="text-[10px] font-black text-blue-900 flex items-center gap-1.5 uppercase hover:gap-2 transition-all p-2 -mr-2"
                                                        >
                                                            View Details <ArrowRight size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center max-w-2xl mx-auto shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TrendingUp size={32} className="text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">No product jars yet</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8">
                            When customers create savings jars for your products on the marketplace, they will appear here. You'll be able to monitor their progress and receive automatic payments upon completion.
                        </p>
                        <Link to="/dashboard/vendor/products" className="inline-flex items-center gap-3 px-8 py-4 bg-blue-900 text-white font-black rounded-2xl hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                            <Package size={20} /> Manage Product Inventory
                        </Link>
                    </div>
                )}
            </div>

            {selectedJarForDetails && (
                <JarDetailsModal 
                    jar={selectedJarForDetails}
                    isOpen={!!selectedJarForDetails}
                    onClose={() => setSelectedJarForDetails(null)}
                />
            )}
        </div>
    )
}
