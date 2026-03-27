import { useState, useEffect } from 'react'
import { Store, ShieldCheck, Star, Search, Menu, MessageSquare } from 'lucide-react'
import { subscribeToAllProducts, subscribeToAllVendors, Product, VendorProfile } from '../lib/db'
import VendorChatModal from '../components/VendorChatModal'
import CreateJarModal from '../components/CreateJarModal'
import ProductDetailsModal from '../components/ProductDetailsModal'
import VendorProfileModal from '../components/VendorProfileModal'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Props { 
    onMenuClick: () => void;
    onOpenMessages: () => void;
    unreadCount: number;
}

export default function Marketplace({ onMenuClick, onOpenMessages, unreadCount }: Props) {
    const { currentUser } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [vendors, setVendors] = useState<VendorProfile[]>([])
    const [chatVendor, setChatVendor] = useState<{ id: string, name: string } | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false)
    const [vendorProfileId, setVendorProfileId] = useState<string | null>(null)
    const [isCreateJarOpen, setIsCreateJarOpen] = useState(false)
    const [jarTargetAmount, setJarTargetAmount] = useState<number | undefined>(undefined)
    
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubProducts = subscribeToAllProducts((data) => {
            setProducts(data)
            setLoading(false)
        })
        const unsubVendors = subscribeToAllVendors((data) => {
            setVendors(data)
        })
        return () => {
            unsubProducts()
            unsubVendors()
        }
    }, [])

    const categories = ['All', 'Electronics', 'Education', 'Events']

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                             p.description.toLowerCase().includes(search.toLowerCase())
        const matchesCat = category === 'All' || p.category.includes(category)
        const isSelf = p.vendorId === currentUser?.uid
        return matchesSearch && matchesCat && !isSelf
    })

    const handleShop = (product: Product, totalAmount?: number) => {
        if (product.vendorId === currentUser?.uid) {
            toast.error("You cannot start a savings jar for your own product.", {
                icon: '🚫',
                style: { borderRadius: '20px', background: '#020617', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
            })
            return
        }
        setSelectedProduct(product)
        setJarTargetAmount(totalAmount || product.price)
        setIsCreateJarOpen(true)
    }

    const openProductDetails = (product: Product) => {
        setSelectedProduct(product)
        setIsProductDetailsOpen(true)
    }

    const openVendorProfile = (vendorId: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation()
        if (vendorId) setVendorProfileId(vendorId)
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-100 px-4 md:px-6 min-h-[68px] py-3 flex flex-col md:flex-row items-center justify-between sticky top-0 z-30 shadow-sm gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                    <button onClick={onMenuClick} className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Menu size={18} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-black text-slate-900 hidden sm:block tracking-tight shrink-0">
                        Marketplace
                    </h1>
                    
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-900 focus:bg-white transition-all font-medium" 
                        />
                    </div>

                    {/* Messages Icon */}
                    <button
                        onClick={onOpenMessages}
                        className="relative w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-blue-50 hover:text-blue-700 transition-colors shrink-0"
                        title="Messages"
                    >
                        <MessageSquare size={18} className="text-slate-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap uppercase tracking-wider ${
                                category === cat 
                                ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' 
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Hero */}
                <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 mb-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black text-blue-100 mb-6 backdrop-blur-md uppercase tracking-wider">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            Direct-to-Merchant Payouts
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-[1.1]">Buy what you love,<br/>save as a <span className="text-emerald-400">Crowd.</span></h2>
                        <p className="text-blue-100/70 text-sm md:text-lg leading-relaxed mb-8 font-medium">
                            Choose an item, initialize a jar, and invite friends to contribute. Once the goal is met, CrowdPay settles the merchant directly. Simple, safe, social.
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Star size={14} className="text-emerald-400 fill-emerald-400" />
                                </div>
                                <span className="text-sm font-bold">4.9/5 Merchant Rating</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <ShieldCheck size={14} className="text-blue-400" />
                                </div>
                                <span className="text-sm font-bold">Interswitch Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-64 bg-slate-200 rounded-[1rem]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => {
                            const vendor = vendors.find(v => v.id === product.vendorId)
                        return (
                            <div 
                                key={product.id} 
                                onClick={() => product.status === 'active' && openProductDetails(product)} 
                                className={`group bg-white rounded-[1rem] border border-slate-200 overflow-hidden transition-all duration-500 flex flex-col ${product.status === 'active' ? 'hover:shadow-2xl hover:shadow-slate-200/60 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                            >
                                {/* Image Wrapper */}
                                <div className="relative h-36 overflow-hidden bg-slate-50 shrink-0">
                                    <img 
                                        src={product.image} 
                                        alt={product.name}
                                        className={`w-full h-full object-cover transition-transform duration-700 ${product.status === 'active' ? 'group-hover:scale-110' : 'grayscale'}`}
                                    />
                                    
                                    {/* Category tag */}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-black text-blue-900 uppercase tracking-wider shadow-sm">
                                            {product.category}
                                        </span>
                                    </div>

                                    {/* Out of Stock overlay */}
                                    {product.status === 'out_of_stock' && (
                                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                                            <span className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-xs font-black text-slate-700 uppercase tracking-widest shadow-lg">
                                                Out of Stock
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3.5 flex-1 flex flex-col bg-white">
                                    <div className="flex flex-col mb-1.5 gap-1">
                                        <h3 className="text-[15px] font-black text-slate-900 tracking-tight group-hover:text-blue-900 transition-colors line-clamp-1">
                                            {product.name}
                                        </h3>
                                        <div className={`text-[15px] font-black ${product.status === 'active' ? 'text-blue-900' : 'text-slate-400 line-through'}`}>
                                            ₦{product.price.toLocaleString()}
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-2.5 line-clamp-2 min-h-[32px]">
                                        {product.description}
                                    </p>

                                    <div className="mb-3">
                                        <button className="w-full py-2 bg-blue-900 text-white text-[11px] font-black rounded-lg hover:bg-blue-800 active:scale-95 transition-all shadow-sm">
                                            Buy Now
                                        </button>
                                    </div>

                                    <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                        <button onClick={(e) => openVendorProfile(vendor?.id, e)} className="flex items-center gap-2 text-left group/vendor active:scale-95 transition-transform max-w-[70%]">
                                            <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/vendor:bg-blue-50 group-hover/vendor:text-blue-600 transition-colors shrink-0">
                                                <Store size={12} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">By</p>
                                                <p className="text-[10px] font-bold text-slate-700 truncate group-hover/vendor:text-blue-600 transition-colors">{vendor?.name || 'Unknown'}</p>
                                            </div>
                                        </button>
                                        <div className="flex items-center gap-1 px-1 py-0.5 bg-amber-50 rounded-md text-amber-500 shrink-0">
                                            <Star size={8} className="fill-current" />
                                            <span className="text-[9px] font-black">{vendor?.rating || '5.0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    </div>
                )}

                {filteredProducts.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No products found</h3>
                        <p className="text-slate-500 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {chatVendor && (
                <VendorChatModal 
                    isOpen={!!chatVendor} 
                    onClose={() => setChatVendor(null)}
                    vendorId={chatVendor.id}
                    vendorName={chatVendor.name}
                    buyerId={currentUser?.uid || ''}
                    buyerName={currentUser?.displayName || 'User'}
                />
            )}

            <ProductDetailsModal
                isOpen={isProductDetailsOpen}
                onClose={() => setIsProductDetailsOpen(false)}
                product={selectedProduct}
                onStartJar={(product, _, totalAmount) => {
                    setIsProductDetailsOpen(false)
                    handleShop(product, totalAmount)
                }}
                onViewStore={(vendorId) => {
                    setIsProductDetailsOpen(false)
                    setVendorProfileId(vendorId)
                }}
                onChat={(vendorId, vendorName) => {
                    setIsProductDetailsOpen(false)
                    setChatVendor({ id: vendorId, name: vendorName })
                }}
            />

            <VendorProfileModal
                isOpen={!!vendorProfileId}
                onClose={() => setVendorProfileId(null)}
                vendorId={vendorProfileId}
                onProductClick={(p: Product) => {
                    setVendorProfileId(null)
                    setSelectedProduct(p)
                    setIsProductDetailsOpen(true)
                }}
            />

            <CreateJarModal 
                isOpen={isCreateJarOpen}
                onClose={() => {
                    setIsCreateJarOpen(false)
                    setSelectedProduct(null)
                    setJarTargetAmount(undefined)
                }}
                onSuccess={(id) => {
                    console.log('Jar created with product', id)
                    setIsCreateJarOpen(false)
                    setSelectedProduct(null)
                    setJarTargetAmount(undefined)
                }}
                initialName={selectedProduct ? `Purchase: ${selectedProduct.name}` : ''}
                initialGoal={jarTargetAmount || selectedProduct?.price}
                initialVendorId={selectedProduct?.vendorId}
                initialProductId={selectedProduct?.id}
                initialProductName={selectedProduct?.name}
            />
        </div>
    )
}
