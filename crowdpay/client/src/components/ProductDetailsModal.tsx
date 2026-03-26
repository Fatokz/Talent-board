import { useState, useEffect } from 'react'
import { X, ShoppingCart, Store, Minus, Plus, ShieldCheck, MessageSquare } from 'lucide-react'
import { Product, VendorProfile, subscribeToVendorProfile } from '../lib/db'

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onStartJar: (product: Product, quantity: number, total: number) => void;
    onViewStore: (vendorId: string) => void;
    onChat: (vendorId: string, vendorName: string) => void;
}

export default function ProductDetailsModal({ isOpen, onClose, product, onStartJar, onViewStore, onChat }: Props) {
    const [quantity, setQuantity] = useState(1)
    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const [vendor, setVendor] = useState<VendorProfile | null>(null)

    useEffect(() => {
        if (!isOpen || !product?.vendorId) return
        setQuantity(1) // reset quantity on open
        setActiveImageIndex(0) // reset gallery index on open
        const unsub = subscribeToVendorProfile(product.vendorId, (v) => setVendor(v))
        return unsub
    }, [isOpen, product])

    if (!isOpen || !product) return null

    const totalPrice = product.price * quantity

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6" onClick={handleBackdropClick}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-none" />
            
            <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-white sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                {/* Mobile Drag Handle (Visual only) */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1 bg-white absolute top-0 z-20 rounded-t-[2.5rem]">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                {/* Header Actions */}
                <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors shadow-lg">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pt-0 sm:pt-0 pb-32 sm:pb-0">
                    {/* Hero Image */}
                    <div className="relative w-full h-72 sm:h-96 bg-slate-100 shrink-0">
                        <img 
                            src={product.images && product.images.length > 0 ? product.images[activeImageIndex] : product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        
                        <div className="absolute bottom-6 left-6 right-6">
                            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20 shadow-sm mb-3 inline-block">
                                {product.category}
                            </span>
                            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                {product.name}
                            </h2>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 sm:p-8 flex-1 flex flex-col gap-8">
                        {/* Image Gallery Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 -mx-6 px-6 sm:mx-0 sm:px-0">
                                {product.images.map((imgUrl, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                                            activeImageIndex === idx 
                                                ? 'border-blue-600 shadow-lg shadow-blue-900/10 scale-105' 
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={imgUrl} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Price and Core Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">₦{product.price.toLocaleString()}</p>
                            </div>
                            
                            {/* Vendor Quick Card & Actions */}
                            <div className="grid grid-cols-2 gap-3 sm:w-auto w-full">
                                <button 
                                    onClick={() => onViewStore(product.vendorId)}
                                    className="flex items-center justify-center gap-2 p-3 rounded-[1rem] border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group text-center"
                                >
                                    <Store size={16} className="text-slate-400 group-hover:text-blue-600" />
                                    <span className="text-[10px] sm:text-xs font-black text-slate-600 group-hover:text-blue-700 uppercase tracking-wider">
                                        View Store
                                    </span>
                                </button>
                                <button 
                                    onClick={() => onChat(product.vendorId, vendor?.name || 'Vendor')}
                                    className="flex items-center justify-center gap-2 p-3 rounded-[1rem] border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group text-center"
                                >
                                    <MessageSquare size={16} className="text-slate-400 group-hover:text-blue-600" />
                                    <span className="text-[10px] sm:text-xs font-black text-slate-600 group-hover:text-blue-700 uppercase tracking-wider">
                                        Chat
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-3">Product Details</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>

                        {/* Guarantee Banner */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-emerald-900 mb-1">CrowdPay Shield</h4>
                                <p className="text-xs text-emerald-700 font-medium leading-relaxed">Funds are only released to the merchant when the jar goal is met and authorized by jar contributors.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="absolute sm:relative bottom-0 left-0 right-0 p-4 sm:p-5 border-t border-slate-100 bg-white shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] shrink-0 z-10 transition-all">
                    <div className="flex flex-row items-center gap-2.5 sm:gap-3">
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between w-[110px] sm:w-[130px] bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-1 h-12 sm:h-14 shrink-0">
                            <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 sm:w-10 h-full rounded-lg sm:rounded-xl flex items-center justify-center text-slate-500 bg-white shadow-sm hover:shadow transition-all disabled:opacity-30 active:scale-95"
                                disabled={quantity <= 1}
                            >
                                <Minus size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            <span className="flex-1 text-center text-xs sm:text-sm font-black text-slate-900">{quantity}</span>
                            <button 
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 sm:w-10 h-full rounded-lg sm:rounded-xl flex items-center justify-center text-slate-500 bg-white shadow-sm hover:shadow transition-all active:scale-95"
                            >
                                <Plus size={14} className="sm:w-4 sm:h-4" />
                            </button>
                        </div>

                        {/* Primary Action */}
                        <button 
                            onClick={() => onStartJar(product, quantity, totalPrice)}
                            className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-between px-3 sm:px-6 shrink-0"
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <ShoppingCart size={14} className="hidden sm:block" />
                                <span className="tracking-widest text-[9px] sm:text-xs uppercase">Start Jar</span>
                            </div>
                            <span className="text-xs sm:text-lg">₦{totalPrice.toLocaleString()}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
