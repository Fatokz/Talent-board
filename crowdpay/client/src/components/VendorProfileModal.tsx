import { useState, useEffect } from 'react'
import { X, Star, Store, ShieldCheck, ShoppingCart } from 'lucide-react'
import { VendorProfile, Product, subscribeToVendorProfile, subscribeToVendorProducts, rateVendor } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vendorId: string | null;
    onProductClick: (product: Product) => void;
}

export default function VendorProfileModal({ isOpen, onClose, vendorId, onProductClick }: Props) {
    const { currentUser } = useAuth()
    const [vendor, setVendor] = useState<VendorProfile | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [submittingRating, setSubmittingRating] = useState(false)

    useEffect(() => {
        if (!isOpen || !vendorId) return
        
        const unsubP = subscribeToVendorProfile(vendorId, setVendor)
        const unsubProd = subscribeToVendorProducts(vendorId, (data) => {
            setProducts(data.filter(p => p.status === 'active'))
        })

        return () => {
            unsubP()
            unsubProd()
        }
    }, [isOpen, vendorId])

    if (!isOpen || !vendor) return null

    const handleRate = async (ratingVal: number) => {
        if (!vendorId) return
        if (!currentUser) return toast.error('Please sign in to rate merchants')
        if (vendorId === currentUser.uid) return toast.error('You cannot rate your own store')

        setSubmittingRating(true)
        try {
            await rateVendor(vendorId, ratingVal, currentUser.uid)
            toast.success(`You rated ${vendor.name} ${ratingVal} stars!`)
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit rating')
        } finally {
            setSubmittingRating(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full h-[100dvh] sm:h-[85vh] sm:max-h-[800px] sm:max-w-4xl bg-slate-50 sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                {/* Mobile Drag Handle */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1 absolute top-0 z-30">
                    <div className="w-12 h-1.5 bg-white/40 rounded-full" />
                </div>

                <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors shadow-lg">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Store Header Banner */}
                    <div className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 pt-20 pb-12 px-6 sm:px-10 text-white shrink-0">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80')] mix-blend-overlay opacity-10 bg-cover bg-center" />
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
                        
                        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white p-2 shadow-2xl -mb-4 sm:-mb-8 relative z-20 shrink-0">
                                <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                    {vendor.logo ? (
                                        <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store size={40} />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 pb-2">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-sm inline-block">
                                        {vendor.category}
                                    </span>
                                    <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                        <ShieldCheck size={12} /> Verified Merchant
                                    </span>
                                </div>
                                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
                                    {vendor.name}
                                </h2>
                                <p className="text-blue-200 text-xs sm:text-sm font-medium w-full max-w-xl mx-auto sm:mx-0">
                                    {vendor.description || 'Welcome to our official CrowdPay store! Check out our latest products below.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Rating Row */}
                    <div className="px-6 sm:px-10 pb-8 pt-4 sm:pt-10 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Global Rating</h3>
                            <div className="flex items-center gap-2 mb-2">
                                <Star size={24} className="text-amber-500 fill-amber-500" />
                                <span className="text-3xl font-black text-slate-900">{vendor.rating.toFixed(1)}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{vendor.ratingCount || 1} Reviews</p>
                        </div>

                        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-center sm:text-left">
                                <h3 className="text-sm font-black text-slate-900 mb-1">Rate this Merchant</h3>
                                <p className="text-xs text-slate-500 font-medium">How was your experience shopping with {vendor.name}?</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        disabled={submittingRating}
                                        onClick={() => handleRate(star)}
                                        className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-300 hover:text-amber-500 flex items-center justify-center transition-all group disabled:opacity-50"
                                    >
                                        <Star size={24} className="transition-all group-hover:fill-amber-500 group-hover:scale-110" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 px-6 sm:px-10 pb-10">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Store Offerings</h3>
                        
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {products.map(p => (
                                    <div key={p.id} onClick={() => onProductClick(p)} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer flex flex-col">
                                        <div className="relative h-40 sm:h-48 overflow-hidden bg-slate-100">
                                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                        </div>
                                        <div className="p-4 sm:p-5 flex-1 flex flex-col">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.category}</div>
                                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                                            
                                            <div className="mt-auto flex items-end justify-between">
                                                <div className="text-sm sm:text-lg font-black text-slate-900">₦{p.price.toLocaleString()}</div>
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <ShoppingCart size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200 py-16 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                                    <Store size={32} />
                                </div>
                                <h4 className="text-base font-black text-slate-900 mb-1">No products available</h4>
                                <p className="text-xs text-slate-500">This merchant has not listed any active products yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
