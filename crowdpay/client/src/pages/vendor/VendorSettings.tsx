import { useState, useEffect } from 'react'
import { 
    Menu, Store, Upload, Camera, Check, Loader2, Tag
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { 
    subscribeToVendorProfile, VendorProfile, updateVendorProfile
} from '../../lib/db'
import { uploadToCloudinary } from '../../lib/cloudinary'
import toast from 'react-hot-toast'

interface Props { onMenuClick?: () => void }

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

export default function VendorSettings({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        logo: ''
    })

    useEffect(() => {
        if (!currentUser?.uid) return
        const unsubProfile = subscribeToVendorProfile(currentUser.uid, (data) => {
            setVendorData(data)
            if (data) {
                setFormData({
                    name: data.name || '',
                    category: data.category || CATEGORIES[0],
                    logo: data.logo || ''
                })
            }
        })
        return () => unsubProfile()
    }, [currentUser])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB')
            return
        }

        setUploading(true)
        try {
            const url = await uploadToCloudinary(file)
            setFormData(prev => ({ ...prev, logo: url }))
            toast.success('Logo uploaded! Click Save to apply changes.')
        } catch (err) {
            console.error('Upload error:', err)
            toast.error('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!currentUser?.uid) return
        if (!formData.name.trim()) {
            toast.error('Store name is required')
            return
        }

        setLoading(true)
        try {
            await updateVendorProfile(currentUser.uid, {
                name: formData.name.trim(),
                category: formData.category,
                logo: formData.logo
            })
            toast.success('Store profile updated successfully!')
        } catch (err) {
            console.error('Save error:', err)
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const hasChanges = vendorData && (
        formData.name !== vendorData.name ||
        formData.category !== vendorData.category ||
        formData.logo !== vendorData.logo
    )

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
                            Merchant Settings
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1 truncate">{vendorData?.name || 'Loading...'}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                {/* Profile Section */}
                <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8 sm:mb-10">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                                <Store size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Store Profile</h2>
                                <p className="text-xs font-medium text-slate-500">Manage your public storefront details.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Logo Upload */}
                        <div className="flex flex-col items-center sm:items-start gap-6">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Logo</label>
                            <div className="relative group">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl sm:rounded-[2rem] bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-400">
                                    {formData.logo ? (
                                        <img src={formData.logo} alt="Store Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Store size={40} className="text-slate-300" />
                                    )}
                                    
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                            <Loader2 size={24} className="text-blue-600 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                
                                <label className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-800 transition-all shadow-xl active:scale-90 border-4 border-white">
                                    <Camera size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">JPG, PNG or WEBP. Max 5MB.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Store Name</label>
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your store name"
                                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-[15px] font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Category</label>
                                <div className="relative">
                                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select 
                                        value={formData.category}
                                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full h-14 pl-12 pr-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-[15px] font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <button 
                                onClick={handleSave}
                                disabled={loading || !hasChanges}
                                className={`h-14 px-8 rounded-2xl text-white text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${
                                    hasChanges 
                                        ? 'bg-blue-900 shadow-blue-900/20 hover:bg-blue-800' 
                                        : 'bg-slate-200 cursor-not-allowed shadow-none'
                                }`}
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <><Check size={18} /> Save Changes</>
                                )}
                            </button>
                            <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest opacity-60">Verification may be required for major identity changes.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
