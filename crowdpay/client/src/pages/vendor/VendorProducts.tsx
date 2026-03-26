import { useState, useEffect } from 'react'
import { 
    Package, Menu, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { 
    subscribeToVendorProfile, VendorProfile, 
    subscribeToVendorProducts, Product, updateProduct, deleteProduct
} from '../../lib/db'
import AddProductModal from '../../components/AddProductModal'
import toast from 'react-hot-toast'

interface Props { onMenuClick?: () => void }

export default function VendorProducts({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Inline editing state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editPrice, setEditPrice] = useState('')

    // Delete confirmation state
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        if (!currentUser?.uid) return
        
        const unsubProfile = subscribeToVendorProfile(currentUser.uid, (data) => {
            setVendorData(data)
        })

        const unsubProducts = subscribeToVendorProducts(currentUser.uid, (data) => {
            setProducts(data.filter(p => p.status !== 'deleted'))
        })

        return () => {
            unsubProfile()
            unsubProducts()
        }
    }, [currentUser])

    const startEdit = (p: Product) => {
        setEditingId(p.id)
        setEditPrice(String(p.price))
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditPrice('')
    }

    const savePrice = async (productId: string) => {
        const newPrice = parseFloat(editPrice)
        if (isNaN(newPrice) || newPrice <= 0) {
            toast.error('Enter a valid price')
            return
        }
        try {
            await updateProduct(productId, { price: newPrice })
            toast.success('Price updated!')
        } catch {
            toast.error('Failed to update price')
        }
        cancelEdit()
    }

    const toggleStock = async (p: Product) => {
        const newStatus: Product['status'] = p.status === 'active' ? 'out_of_stock' : 'active'
        try {
            await updateProduct(p.id, { status: newStatus })
            toast.success(newStatus === 'active' ? 'Product is now active' : 'Marked as out of stock')
        } catch {
            toast.error('Failed to update status')
        }
    }

    const confirmDelete = async (productId: string) => {
        try {
            await deleteProduct(productId)
            toast.success('Product removed from marketplace')
        } catch {
            toast.error('Failed to delete product')
        }
        setDeletingId(null)
    }

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
                            Product Inventory
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1 truncate">{vendorData?.name || 'Loading...'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-9 sm:h-10 px-3 sm:px-5 rounded-xl bg-blue-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap shrink-0"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                {/* Delete Confirmation Banner */}
                {deletingId && (
                    <div className="mb-4 flex items-center gap-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        <AlertTriangle size={20} className="text-red-500 shrink-0" />
                        <p className="flex-1 text-sm font-bold text-red-700">Remove this product from the marketplace? This cannot be undone.</p>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => confirmDelete(deletingId)} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                )}

                {/* Full Products List */}
                <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-sm">
                    {products.length > 0 ? (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[580px]">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price (₦)</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {products.map((p) => (
                                        <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${deletingId === p.id ? 'bg-red-50/30' : ''}`}>
                                            {/* Product Name + Image */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={p.image} alt={p.name} className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">{p.description}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{p.category}</td>

                                            {/* Inline Price Edit */}
                                            <td className="px-6 py-4">
                                                {editingId === p.id ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400 font-black text-sm">₦</span>
                                                        <input
                                                            type="number"
                                                            value={editPrice}
                                                            onChange={e => setEditPrice(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') savePrice(p.id); if (e.key === 'Escape') cancelEdit() }}
                                                            autoFocus
                                                            className="w-24 px-2 py-1 text-sm font-black border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                                                        />
                                                        <button onClick={() => savePrice(p.id)} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-black text-slate-900">₦{p.price.toLocaleString()}</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                                    p.status === 'active' 
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                    {p.status === 'active' ? 'Active' : 'Out of Stock'}
                                                </span>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Edit Price */}
                                                    <button 
                                                        onClick={() => startEdit(p)}
                                                        title="Edit price"
                                                        className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>

                                                    {/* Toggle Stock */}
                                                    <button 
                                                        onClick={() => toggleStock(p)}
                                                        title={p.status === 'active' ? 'Mark out of stock' : 'Mark active'}
                                                        className={`p-2 rounded-xl transition-colors ${
                                                            p.status === 'active' 
                                                                ? 'hover:bg-amber-50 text-emerald-500 hover:text-amber-500' 
                                                                : 'hover:bg-emerald-50 text-amber-500 hover:text-emerald-500'
                                                        }`}
                                                    >
                                                        {p.status === 'active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                                                    </button>

                                                    {/* Delete */}
                                                    <button 
                                                        onClick={() => setDeletingId(p.id)}
                                                        title="Remove product"
                                                        className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 px-6 text-center">
                            <Package size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-sm font-bold text-slate-400">No products added yet.</p>
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="mt-4 text-xs font-black text-white bg-blue-900 px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                            >
                                Create your first product
                            </button>
                        </div>
                    )}
                </div>

                {products.length > 0 && (
                    <p className="text-center text-xs text-slate-400 mt-4 font-medium">{products.length} product{products.length !== 1 ? 's' : ''} listed in the marketplace</p>
                )}
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
