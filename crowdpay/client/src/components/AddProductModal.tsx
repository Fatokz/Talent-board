import { useState } from 'react'
import { X, Package, DollarSign, Tag, Image as ImageIcon, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { createProduct } from '../lib/db'

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
        description: '',
        image: ''
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!form.name || !form.price || !form.category) {
            toast.error('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            await createProduct({
                name: form.name,
                price: parseFloat(form.price),
                category: form.category,
                description: form.description || `High-quality ${form.name}`,
                image: form.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200',
                vendorId: vendorId
            })
            
            toast.success('Product added successfully!')
            setForm({ name: '', price: '', category: CATEGORIES[0], description: '', image: '' })
            onClose()
        } catch (err) {
            console.error(err)
            toast.error('Failed to add product')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                        <X size={15} />
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight uppercase">Add New Product</h2>
                            <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-widest">Inventory Management</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                            <input 
                                type="text" 
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="iPhone 15 Pro Max" 
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
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
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
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
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700 appearance-none focus:outline-none focus:border-blue-600 transition-all cursor-pointer"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
                            <div className="relative">
                                <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="url" 
                                    value={form.image}
                                    onChange={e => setForm({...form, image: e.target.value})}
                                    placeholder="https://..." 
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea 
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            placeholder="Tell buyers more about your product..."
                            rows={3}
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-600 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Plus size={18} /> LIST PRODUCT IN MARKETPLACE</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
