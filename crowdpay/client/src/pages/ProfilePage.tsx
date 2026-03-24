import { useState, useEffect } from 'react'
import {
    ShieldCheck, User, MapPin, Phone, Hash, AlertTriangle, CheckCircle, RefreshCcw, Menu
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserDoc, updateUserProfile, UserProfile } from '../lib/db'
import { apiFetch } from '../utils/api';

interface Props { onMenuClick?: () => void }

export default function ProfilePage({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [nin, setNin] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')

    useEffect(() => {
        if (!currentUser) return
        const unsub = subscribeToUserDoc(currentUser.uid, (data) => {
            setProfile(data)
            if (data) {
                if (data.nin && !nin) setNin(data.nin)
                if (data.phoneNumber && !phone) setPhone(data.phoneNumber)
                if (data.address && !address) setAddress(data.address)
            }
            setLoading(false)
        })
        return unsub
    }, [currentUser])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (nin.length !== 11) {
            setError('NIN must be exactly 11 digits.')
            return
        }

        if (!phone || !address) {
            setError('Phone number and address are required.')
            return
        }

        // NEW: Split fullName for the Interswitch API requirement
        const nameParts = (profile?.fullName || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setVerifying(true)
        if (currentUser) {
            await updateUserProfile(currentUser.uid, { kycStatus: 'pending' })
        }

        try {
            const res = await apiFetch('/api/verify-nin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nin,
                    firstName, // UPDATED
                    lastName,  // UPDATED
                    uid: currentUser?.uid
                })
            })

            const json = await res.json()

            if (!res.ok || !json.success) {
                setError(json.message || 'Verification failed. Please check your details.')
                await updateUserProfile(currentUser!.uid, { kycStatus: 'unverified' })
            } else {
                // Success: Profile is now "locked" with official data from Interswitch
                await updateUserProfile(currentUser!.uid, {
                    kycStatus: 'verified',
                    nin,
                    phoneNumber: phone,
                    address,
                    // Optional: Sync back the official names from the API response
                    fullName: `${json.data.firstName} ${json.data.lastName}`.trim()
                })
            }
        } catch (err: any) {
            setError('Network error occurred during verification.')
            await updateUserProfile(currentUser!.uid, { kycStatus: 'unverified' })
        } finally {
            setVerifying(false)
        }
    }

    if (loading || !profile) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <RefreshCcw size={24} className="text-blue-500 animate-spin" />
            </div>
        )
    }

    const isVerified = profile.kycStatus === 'verified'
    const isPending = profile.kycStatus === 'pending' || verifying

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-100 px-6 h-[68px] flex items-center sticky top-0 z-20 shadow-sm">
                <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mr-4">
                    <Menu size={17} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        Account Profile
                    </h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 mt-4">
                {/* ── KYC Status Banner ── */}
                {!isVerified ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-5 shadow-sm">
                        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                            <AlertTriangle size={24} className="text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-black text-amber-900 mb-1">Identity Verification Required</h2>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                To unlock full access to CrowdPay (creating jars, funding, and accepting invites), 
                                regulatory compliance requires us to verify your National Identity Number (NIN).
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-5 shadow-sm">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                            <ShieldCheck size={24} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-black text-emerald-900 mb-1">Identity Verified ✅</h2>
                            <p className="text-sm text-emerald-700 leading-relaxed">
                                Your account is fully verified. You have unrestricted access to all CrowdPay features.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Profile Form ── */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Personal Information</h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Full Name (Read-only from Auth) */}
                            <div>
                                <label className="block text-xs font-bold font-black text-slate-700 mb-1.5 ml-1">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={profile.fullName} 
                                        readOnly
                                        className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm focus:outline-none cursor-not-allowed font-medium" 
                                    />
                                </div>
                            </div>

                            {/* Email (Read-only from Auth) */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5 ml-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">@</div>
                                    <input 
                                        type="text" 
                                        value={profile.email} 
                                        readOnly
                                        className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm focus:outline-none cursor-not-allowed font-medium" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-xs font-black text-slate-700 mb-1.5 ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="tel" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)}
                                    disabled={isVerified || isPending}
                                    placeholder="e.g. 08012345678"
                                    className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500" 
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-xs font-black text-slate-700 mb-1.5 ml-1">Residential Address</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <textarea 
                                    value={address} 
                                    onChange={e => setAddress(e.target.value)}
                                    disabled={isVerified || isPending}
                                    placeholder="Full street address..."
                                    rows={3}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-shadow disabled:bg-slate-50 disabled:text-slate-500" 
                                />
                            </div>
                        </div>

                        {/* NIN (The critical part) */}
                        <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <label className="block text-xs font-black text-blue-900 mb-1.5 ml-1">National Identity Number (NIN)</label>
                            <p className="text-[11px] text-blue-600 mb-3 leading-relaxed">
                                Used to verify your identity via Interswitch. Your data is encrypted and secure.
                            </p>
                            <div className="relative">
                                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                                <input 
                                    type="text" 
                                    maxLength={11}
                                    value={nin} 
                                    onChange={e => setNin(e.target.value.replace(/\D/g, ''))} // only numbers
                                    disabled={isVerified || isPending}
                                    placeholder="Enter your 11-digit NIN"
                                    className="w-full pl-10 pr-4 h-12 rounded-xl border border-blue-200 bg-white text-slate-900 text-sm font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-blue-50/50 disabled:text-blue-900/50" 
                                />
                            </div>
                            {error && (
                                <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
                                    <AlertTriangle size={12} /> {error}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        {!isVerified && (
                            <button
                                type="submit"
                                disabled={isPending || nin.length !== 11 || !phone || !address}
                                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black text-sm shadow-lg shadow-blue-900/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isPending ? (
                                    <><RefreshCcw size={16} className="animate-spin" /> Verifying Identity...</>
                                ) : (
                                    <><ShieldCheck size={18} /> Verify & Complete Profile</>
                                )}
                            </button>
                        )}
                        
                        {isVerified && (
                            <div className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-50 text-emerald-600 font-black text-sm border border-emerald-200 cursor-default">
                                <CheckCircle size={18} /> Information Locked & Verified
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
