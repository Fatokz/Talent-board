import { useState } from 'react'
import { X, Package, DollarSign, Tag, Plus, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import { createProduct } from '../lib/db'
import { uploadToCloudinary } from '../lib/cloudinary'

interface Props {
    isOpen: boolean
    onClose: () => void
    vendorId: string
}

const CATEGORIES = [
    'Electronics & Gadgets',
    'Fashion & Apparel',
    'Food & Beverage',
    'Health & Beauty',
    'Home & Furniture',
    'Professional Services',
    'Education & Training',
    'Travel & Leisure',
    'General Retail'
]

export default function AddProductModal({ isOpen, onClose, vendorId }: Props) {
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        price: '',
        category: CATEGORIES[0],
        description: ''
    })
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!form.name || !form.price || !form.category) {
            toast.error('Please fill in all required fields')
            return
        }

        if (imageFiles.length === 0) {
            toast.error('Please upload at least one product image')
            return
        }

        setLoading(true)
        try {
            // Upload physical image files in parallel
            const uploadedUrls = await Promise.all(
                imageFiles.map(file => uploadToCloudinary(file))
            )

            await createProduct({
                name: form.name,
                price: parseFloat(form.price),
                category: form.category,
                description: form.description || `High-quality ${form.name}`,
                image: uploadedUrls[0], // primary thumbnail
                images: uploadedUrls, // all images array
                vendorId: vendorId
            })
            
            toast.success('Product added successfully!')
            setForm({ name: '', price: '', category: CATEGORIES[0], description: '' })
            setImageFiles([])
            setImagePreviews([])
            onClose()
        } catch (err: any) {
            console.error('Product upload error:', err)
            const msg = err?.message || err?.code || 'Unknown error'
            toast.error(`Failed to add product: ${msg}`)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setForm({ name: '', price: '', category: CATEGORIES[0], description: '' })
        setImageFiles([])
        setImagePreviews([])
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
            
            <div className="relative w-full max-w-lg bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-6 sm:p-8 text-white relative shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                    <button type="button" onClick={handleClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors z-[60]">
                        <X size={15} />
                    </button>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                            <Package size={24} className="sm:w-7 sm:h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Add New Product</h2>
                            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">Inventory Management</p>
                        </div>
                    </div>
                </div>

                <form id="add-product-form" onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 sm:space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                            <input 
                                type="text" 
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="e.g. iPhone 15 Pro Max" 
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[16px] sm:text-sm font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₦)</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="number" 
                                    value={form.price}
                                    onChange={e => setForm({...form, price: e.target.value})}
                                    placeholder="0.00" 
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-[16px] sm:text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 shrink-0">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <select 
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-[16px] sm:text-sm font-black text-slate-700 appearance-none focus:outline-none focus:border-blue-600 transition-all cursor-pointer"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Images (Up to 5)</label>
                            
                            {imagePreviews.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                    {imagePreviews.map((preview, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setImageFiles(prev => prev.filter((_, i) => i !== idx))
                                                    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
                                                }}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {imagePreviews.length < 5 && (
                                        <label htmlFor="product-image-upload" className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 flex flex-col items-center justify-center transition-all cursor-pointer">
                                            <Plus size={24} className="text-slate-400 mb-1" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add</span>
                                        </label>
                                    )}
                                </div>
                            ) : (
                                <label 
                                    htmlFor="product-image-upload"
                                    className="w-full h-32 sm:h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-blue-600">
                                        <UploadCloud size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">Click to upload images</p>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">JPG, PNG OR WEBP</p>
                                </label>
                            )}

                            <input 
                                type="file" 
                                multiple
                                accept="image/jpeg, image/png, image/webp"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || [])
                                    if (files.length) {
                                        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024)
                                        if (validFiles.length !== files.length) {
                                            toast.error('Some images were skipped (exceeded 5MB)')
                                        }
                                        if (imageFiles.length + validFiles.length > 5) {
                                            toast.error('Maximum 5 images allowed')
                                            return
                                        }
                                        setImageFiles(prev => [...prev, ...validFiles])
                                        setImagePreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))])
                                    }
                                    e.target.value = ''
                                }}
                                className="hidden"
                                id="product-image-upload"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pb-2 sm:pb-0">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea 
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            placeholder="Tell buyers more about your product..."
                            rows={3}
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-[16px] sm:text-sm font-medium focus:outline-none focus:border-blue-600 transition-all resize-none"
                        />
                    </div>
                </form>

                {/* Sticky Footer for Mobile Accessibility */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] shrink-0 flex flex-row items-center gap-2.5 sm:gap-3">
                    <button 
                        type="button" 
                        onClick={handleClose}
                        className="w-1/3 sm:w-32 h-12 sm:h-14 rounded-xl sm:rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center uppercase tracking-widest text-[10px] sm:text-xs shrink-0 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="add-product-form"
                        disabled={loading}
                        className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-[10px] sm:text-xs tracking-widest shrink-0"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><Plus size={16} className="mb-0.5" /> LIST PRODUCT</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
