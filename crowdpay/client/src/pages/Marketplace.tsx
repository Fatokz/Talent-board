import { useState, useEffect } from 'react'
import { Store, ShieldCheck, Star, MessageSquare, ShoppingCart, Search, Menu } from 'lucide-react'
import { subscribeToAllProducts, subscribeToAllVendors, Product, VendorProfile } from '../lib/db'
import VendorChatModal from '../components/VendorChatModal'
import CreateJarModal from '../components/CreateJarModal'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Props { onMenuClick?: () => void }

export default function Marketplace({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [chatVendor, setChatVendor] = useState<{ id: string; name: string } | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isCreateJarOpen, setIsCreateJarOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [products, setProducts] = useState<Product[]>([])
    const [vendors, setVendors] = useState<VendorProfile[]>([])
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
        const matchesCat = category === 'All' || p.category.includes(category) // Using includes to handle "Electronics & Gadgets" vs "Electronics"
        return matchesSearch && matchesCat
    })

    const handleShop = (product: Product) => {
        if (product.vendorId === currentUser?.uid) {
            toast.error("You cannot start a savings jar for your own product.", {
                icon: '🚫',
                style: { borderRadius: '20px', background: '#020617', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
            })
            return
        }
        setSelectedProduct(product)
        setIsCreateJarOpen(true)
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-96 bg-slate-200 rounded-[2.5rem]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProducts.map((product) => {
                            const vendor = vendors.find(v => v.id === product.vendorId)
                        return (
                            <div key={product.id} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 flex flex-col">
                                {/* Image Wrapper */}
                                <div className="relative h-60 overflow-hidden bg-slate-100">
                                    <img 
                                        src={product.image} 
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-blue-900 border border-white uppercase tracking-wider shadow-sm">
                                            {product.category}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <button 
                                            onClick={() => setChatVendor({ id: vendor?.id || '', name: vendor?.name || '' })}
                                            className="h-10 px-3 rounded-xl bg-white text-slate-900 text-[10px] font-black flex items-center justify-center gap-2 hover:bg-blue-900 hover:text-white transition-colors shadow-lg uppercase tracking-wider grow"
                                        >
                                            <MessageSquare size={14} /> Chat
                                        </button>
                                        <button 
                                            onClick={() => handleShop(product)}
                                            className="h-10 px-3 rounded-xl bg-blue-900 text-white text-[10px] font-black flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors shadow-lg uppercase tracking-wider grow"
                                        >
                                            <ShoppingCart size={14} /> Start Jar
                                        </button>
                                    </div>
                                </div>

                                <div className="p-7 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-900 transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="text-xl font-black text-slate-900">
                                            ₦{product.price.toLocaleString()}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                                        {product.description}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <Store size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sold By</p>
                                                <p className="text-xs font-bold text-slate-700">{vendor?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star size={12} className="fill-current" />
                                            <span className="text-xs font-black">{vendor?.rating}</span>
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
                />
            )}

            <CreateJarModal 
                isOpen={isCreateJarOpen}
                onClose={() => {
                    setIsCreateJarOpen(false)
                    setSelectedProduct(null)
                }}
                onSuccess={(id) => {
                    console.log('Jar created with product', id)
                    setIsCreateJarOpen(false)
                    setSelectedProduct(null)
                }}
                initialName={selectedProduct ? `Purchase: ${selectedProduct.name}` : ''}
                initialGoal={selectedProduct?.price}
                initialVendorId={selectedProduct?.vendorId}
            />
        </div>
    )
}
