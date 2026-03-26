import { useState, useEffect } from 'react'
import { 
    Menu, KeyRound, Store
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { 
    subscribeToVendorProfile, VendorProfile
} from '../../lib/db'

interface Props { onMenuClick?: () => void }

export default function VendorSettings({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)

    useEffect(() => {
        if (!currentUser?.uid) return
        const unsubProfile = subscribeToVendorProfile(currentUser.uid, (data) => {
            setVendorData(data)
        })
        return () => unsubProfile()
    }, [currentUser])

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
                    <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                            <Store size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Store Profile</h2>
                            <p className="text-xs font-medium text-slate-500">Manage your public storefront details.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Store Name</label>
                            <input 
                                type="text"
                                disabled
                                value={vendorData?.name || ''}
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Business Category</label>
                            <input 
                                type="text"
                                disabled
                                value={vendorData?.category || ''}
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold capitalize focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="pt-4">
                            <button className="px-6 py-3.5 sm:py-3 w-full sm:w-auto rounded-xl bg-blue-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 opacity-50 cursor-not-allowed">
                                Save Changes
                            </button>
                            <p className="text-[10px] text-slate-400 mt-3 font-medium">To update official store details, please contact CrowdPay Admin Support.</p>
                        </div>
                    </div>
                </div>
                
                {/* Security Section Placeholder */}
                <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm opacity-60">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 text-slate-400 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                            <KeyRound size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">API Keys & Security</h2>
                            <p className="text-xs font-medium text-slate-500">Coming soon in phase 3.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
