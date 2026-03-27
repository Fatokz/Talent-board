import { useState, useEffect } from 'react'
import { 
    Menu, Wallet, ArrowUpRight, ShieldCheck, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { 
    subscribeToVendorProfile, VendorProfile
} from '../../lib/db'
import toast from 'react-hot-toast'

interface Props { onMenuClick?: () => void }

export default function VendorPayouts({ onMenuClick }: Props) {
    const { currentUser, userProfile } = useAuth()
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)

    const isVerified = userProfile?.kycStatus === 'verified'

    useEffect(() => {
        if (!currentUser?.uid) return
        const unsubProfile = subscribeToVendorProfile(currentUser.uid, (data) => {
            setVendorData(data)
        })
        return () => unsubProfile()
    }, [currentUser])

    const handleWithdraw = () => {
        if (!isVerified) {
            toast.error('Payouts are locked pending full KYC verification.')
            return
        }
        toast.success("Ready for withdrawal! Payout module coming in the next phase.")
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
                            Earnings & Payouts
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1 truncate">{vendorData?.name || 'Loading...'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isVerified ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck size={12} strokeWidth={3} /> Verified
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-wider">
                            <AlertTriangle size={12} strokeWidth={3} /> Pending KYC
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20 mb-6 sm:mb-8">
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
                        <div>
                            <p className="text-[11px] sm:text-xs font-black text-blue-200 uppercase tracking-widest mb-1 sm:mb-2">Available Balance</p>
                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">₦0.00</h2>
                        </div>
                         <button 
                            onClick={handleWithdraw}
                            className={`px-6 py-3.5 sm:py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 ${
                                isVerified 
                                ? 'bg-white text-blue-900 hover:bg-blue-50' 
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                            }`}
                        >
                            Withdraw Funds <ArrowUpRight size={16} />
                        </button>
                    </div>
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 text-slate-300 rounded-[1.25rem] sm:rounded-3xl flex items-center justify-center mb-5 sm:mb-6">
                        <Wallet size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase mb-2">No Transactions Yet</h3>
                    <p className="text-[13px] sm:text-sm font-medium text-slate-500 mb-6 sm:mb-8 max-w-md">Once you start fulfilling orders, your earnings will appear here and be tracked via an automated ledger system.</p>
                </div>
            </div>
        </div>
    )
}
