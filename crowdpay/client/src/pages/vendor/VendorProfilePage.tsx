import { useState, useEffect } from 'react'
import { Menu, Store, User, Mail, BadgeCheck, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorProfile, subscribeToUserDoc, VendorProfile, UserProfile } from '../../lib/db'
import { useNavigate } from 'react-router-dom'

interface Props { onMenuClick?: () => void }

export default function VendorProfilePage({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const navigate = useNavigate()
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!currentUser?.uid) return
        const unsubVendor = subscribeToVendorProfile(currentUser.uid, (v) => {
            setVendorData(v)
            setLoading(false)
        })
        const unsubUser = subscribeToUserDoc(currentUser.uid, (u) => {
            setUserProfile(u)
        })
        return () => { unsubVendor(); unsubUser() }
    }, [currentUser])

    const isKycVerified = userProfile?.kycStatus === 'verified'

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-4 sm:px-6 h-[68px] flex items-center gap-4 sticky top-0 z-20 shadow-sm">
                <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors">
                    <Menu size={18} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Merchant Profile</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">{vendorData?.name || 'Store Info'}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-4 space-y-6">
                {/* KYC Status Card */}
                <div
                    onClick={() => navigate('/dashboard/vendor/kyc')}
                    className={`cursor-pointer flex items-center gap-5 p-5 rounded-2xl border transition-all hover:scale-[1.01] ${isKycVerified
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'}`}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isKycVerified ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        {isKycVerified
                            ? <ShieldCheck size={22} className="text-emerald-600" />
                            : <AlertTriangle size={22} className="text-amber-600" />}
                    </div>
                    <div className="flex-1">
                        <p className={`font-black text-sm ${isKycVerified ? 'text-emerald-900' : 'text-amber-900'}`}>
                            {isKycVerified ? 'KYC Verified' : 'KYC Not Completed'}
                        </p>
                        <p className={`text-xs mt-0.5 ${isKycVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isKycVerified ? 'Your identity and bank account are verified.' : 'Click here to complete your identity verification.'}
                        </p>
                    </div>
                    {!isKycVerified && (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                            Complete KYC →
                        </span>
                    )}
                </div>

                {/* Store Info */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <Store size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Store Information</h2>
                            <p className="text-xs text-slate-400">Your public merchant profile</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[
                            { label: 'Store Name', value: vendorData?.name, icon: Store },
                            { label: 'Business Category', value: vendorData?.category, icon: BadgeCheck },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label}>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</label>
                                <div className="relative">
                                    <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" disabled value={value || '—'} className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold capitalize focus:outline-none cursor-not-allowed" />
                                </div>
                            </div>
                        ))}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                            <div className="relative">
                                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" disabled value={userProfile?.fullName || '—'} className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold focus:outline-none cursor-not-allowed" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" disabled value={userProfile?.email || '—'} className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold focus:outline-none cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    {vendorData?.description && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Store Description</label>
                            <div className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm leading-relaxed">
                                {vendorData.description}
                            </div>
                        </div>
                    )}
                    <p className="text-[10px] text-slate-400 font-medium">To update official store details, please contact CrowdPay Admin Support.</p>
                </div>

                {/* Bank Info (only if KYC passed) */}
                {isKycVerified && userProfile?.bankName && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-5">Bank Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { label: 'Bank Name', value: userProfile.bankName },
                                { label: 'Account Number', value: userProfile.accountNumber },
                                { label: 'Account Name', value: userProfile.accountName },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</label>
                                    <input type="text" disabled value={value || '—'} className="w-full px-4 h-11 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-bold focus:outline-none cursor-not-allowed" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
