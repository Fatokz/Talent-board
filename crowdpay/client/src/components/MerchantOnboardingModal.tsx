import { useState } from 'react'
import { X, Store, Briefcase, Rocket, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { createVendorProfile } from '../lib/db'
import { useNavigate } from 'react-router-dom'

interface Props {
    isOpen: boolean
    onClose: () => void
    uid: string
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

export default function MerchantOnboardingModal({ isOpen, onClose, uid }: Props) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        category: CATEGORIES[0]
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) {
            toast.error('Business Name is required')
            return
        }

        setLoading(true)
        try {
            await createVendorProfile(uid, {
                name: form.name,
                category: form.category,
                description: `Verified merchant profile for ${form.name}`,
                bankName: '',
                accountNumber: '',
                accountName: '',
                walletBalance: 0,
                pendingBalance: 0
            })
            
            toast.success('Merchant profile created!')
            onClose()
            navigate('/dashboard/vendor')
        } catch (err) {
            console.error(err)
            toast.error('Failed to create merchant profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header Header */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                        <X size={15} />
                    </button>
                    
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                        <Store size={28} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Become a Merchant</h2>
                    <p className="text-emerald-100 text-xs font-medium mt-1">Grow your business with CrowdPay marketplace.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input 
                                    type="text" 
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    placeholder="e.g. Fatoz Electronics" 
                                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Category</label>
                            <div className="relative">
                                <Rocket className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <select 
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700 appearance-none focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
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
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
                                By proceeding, you agree to our merchant terms. Account verification will follow after your first sale.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>START SELLING NOW <ArrowRight size={18} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function ArrowRight({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
    )
}
