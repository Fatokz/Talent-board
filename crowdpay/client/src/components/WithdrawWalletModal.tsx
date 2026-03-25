import { useState, useEffect } from 'react'
import { X, Building2, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { UserProfile } from '../lib/db'
import WalletPinModal from './WalletPinModal'
import toast from 'react-hot-toast'

interface Props {
    isOpen: boolean
    onClose: () => void
    profile: UserProfile | null
}

export default function WithdrawWalletModal({ isOpen, onClose, profile }: Props) {
    const { currentUser } = useAuth()
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [txnRef, setTxnRef] = useState('')
    const [pinModalOpen, setPinModalOpen] = useState(false)

    // Reset state on every open
    useEffect(() => {
        if (isOpen) {
            setAmount('')
            setLoading(false)
            setError('')
            setSuccess(false)
            setTxnRef('')
        }
    }, [isOpen])

    if (!isOpen || !profile) return null

    const maxAmount = profile.walletBalance || 0

    const handleWithdraw = async () => {
        const val = Number(amount)
        if (isNaN(val) || val < 500) {
            const msg = 'Minimum withdrawal amount is ₦500.'
            setError(msg)
            toast.error(msg)
            return
        }
        if (val > maxAmount) {
            const msg = 'Amount exceeds your available balance.'
            setError(msg)
            toast.error(msg)
            return
        }

        if (!profile.bankCode || !profile.accountNumber) {
            const msg = 'No bank account found. Please verify your KYC profile first.'
            setError(msg)
            toast.error(msg)
            return
        }

        // Open PIN modal first — DO NOT proceed without PIN
        setPinModalOpen(true)
    }

    const executeWithdrawal = async (pin: string) => {
        const val = Number(amount)
        setLoading(true)
        setError('')
        
        try {
            const res = await fetch(`/api/withdraw?action=wallet-withdraw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: currentUser?.uid,
                    amount: val,
                    pin
                })
            })
            const json = await res.json()
            if (res.ok && json.success) {
                setSuccess(true)
                setTxnRef(json.data.txnRef || '')
                toast.success('Withdrawal successful!')
            } else {
                const msg = json.message || 'Withdrawal failed'
                setError(msg)
                toast.error(msg)
            }
        } catch (err: any) {
            setError('Network error occurred.')
            toast.error('Network error occurred.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
        <WalletPinModal
            isOpen={pinModalOpen}
            onClose={() => setPinModalOpen(false)}
            onSuccess={(p) => { setPinModalOpen(false); executeWithdrawal(p); }}
            title="Authorise Withdrawal"
            subtitle="Enter your 4-digit wallet PIN to confirm this withdrawal."
        />
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 font-sans">
            <div onClick={success ? onClose : undefined} className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" />
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-black text-slate-900">Withdraw to Bank</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
                                <ArrowUpRight size={32} />
                            </div>
                            <h3 className="font-black text-slate-900 text-lg mb-2">Withdrawal Successful!</h3>
                            <p className="text-sm text-slate-500 mb-2">Your funds are being transferred to your {profile.bankName} account.</p>
                            
                            {txnRef && (
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-6">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Reference ID</p>
                                    <p className="text-xs font-mono font-bold text-slate-600 break-all">{txnRef}</p>
                                </div>
                            )}

                            <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-slate-900 text-white">Done</button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200">
                                <p className="text-xs text-slate-500 font-semibold mb-1">Available Balance</p>
                                <p className="text-2xl font-black text-slate-900">₦{(profile.walletBalance || 0).toLocaleString()}</p>
                            </div>

                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700">Amount to Withdraw</label>
                                    <span className="text-xs text-slate-400 font-medium">Min: ₦500 · Max: ₦{maxAmount.toLocaleString()}</span>
                                </div>
                                <input 
                                    type="number" 
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-lg font-medium"
                                />
                                <button className="text-xs font-bold text-blue-600 mt-2 hover:underline" onClick={() => setAmount(String(maxAmount))}>Withdraw Max</button>
                            </div>

                            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl mb-6">
                                <Building2 size={16} className="text-blue-600" />
                                <div>
                                    <p className="text-xs font-bold text-blue-900">{profile.bankName || 'Verified Bank'}</p>
                                    <p className="text-[10px] text-blue-700 tracking-widest">{profile.accountNumber}</p>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-xl mb-4">
                                    <AlertTriangle size={14} /> {error}
                                </div>
                            )}

                            <button onClick={handleWithdraw} disabled={loading || !amount}
                                className="w-full py-3.5 rounded-xl font-black text-[15px] bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95">
                                {loading ? 'Processing...' : 'Confirm Withdrawal'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
        </>
    )
}
