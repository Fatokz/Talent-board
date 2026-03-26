import { useState, useEffect } from 'react'
import { X, Lock, Coins, ShieldCheck, CreditCard, Loader2 } from 'lucide-react'
import { JarTemplate } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { UserProfile } from '../lib/db'
import WalletPinModal from './WalletPinModal'
import toast from 'react-hot-toast'
import { Wallet } from 'lucide-react'

interface Props {
    isOpen: boolean
    onClose: () => void
    jar: JarTemplate
    profile?: UserProfile | null
}

export default function FundJarModal({ isOpen, onClose, jar, profile }: Props) {
    const { currentUser } = useAuth()
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [fundingSource, setFundingSource] = useState<'interswitch' | 'wallet'>('interswitch')
    const [pinModalOpen, setPinModalOpen] = useState(false)

    // Reset state every time the modal opens so stale loading/error never persists
    useEffect(() => {
        if (isOpen) {
            setAmount('')
            setLoading(false)
            setError('')
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleFund = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        
        const numAmount = Number(amount.replace(/,/g, ''))
        if (!numAmount || numAmount < 500) {
            toast.error('Minimum contribution amount is ₦500')
            return
        }

        if (numAmount > 1000000) {
            toast.error('Maximum single transaction limit is ₦1,000,000')
            return
        }

        if (fundingSource === 'wallet') {
            if ((profile?.walletBalance || 0) < numAmount) {
                toast.error('Insufficient wallet balance.')
                return
            }
            setPinModalOpen(true)
            return
        }

        setLoading(true)
        try {
            // 1. Get Interswitch Payment Credentials from our Vercel Serverless Function
            const res = await fetch('/api/initiate-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: numAmount,
                    jarId: jar.id,
                    email: currentUser?.email || 'test@crowdpay.com'
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to initiate payment')
            toast.success('Initializing Secure Payment...')
            // ... (rest of the existing logic for live Interswitch mode)

            // 2. Load inline script dynamically
            const isProd = import.meta.env.PROD // Vite checks if production build
            const scriptUrl = isProd 
                ? 'https://webpay.interswitchng.com/collections/public/javascripts/inline-checkout.js'
                : 'https://qa.interswitchng.com/collections/public/javascripts/inline-checkout.js'

            if (!document.getElementById('interswitch-inline')) {
                const script = document.createElement('script')
                script.id = 'interswitch-inline'
                script.src = scriptUrl
                document.body.appendChild(script)
                await new Promise(resolve => script.onload = resolve)
            }

            // 3. Launch the inline WebCheckout modal
            (window as any).webpayCheckout({
                merchant_code: String(data.productId || 'MX179536'),
                pay_item_id: String(data.payItemId || 'Default_Payable_MX179536'),
                txn_ref: String(data.txnRef),
                amount: String(data.amount || Math.round(numAmount * 100)),
                currency: String(data.currency || '566'),
                site_redirect_url: data.siteRedirectUrl,
                mode: isProd ? 'LIVE' : 'TEST',
                onComplete: async function(response: any) {
                    console.log("Interswitch Callback:", response);

                    // Interswitch Success Response Codes are '00' and '000'
                    if (response.resp !== '00' && response.resp !== '000') {
                        toast.error(response.desc || 'Payment transaction was not successful.');
                        setLoading(false);
                        return;
                    }

                    setLoading(true);
                    try {
                        const verifyReq = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                txnRef: response.txnref || data.txnRef, 
                                amount: numAmount, 
                                uid: currentUser?.uid,
                                jarId: jar.id
                            })
                        });
                        const verifyRes = await verifyReq.json();
                        if (verifyRes.success) {
                            toast.success('Payment Verification Successful! Jar Funded.');
                            onClose();
                        } else {
                            toast.error(verifyRes.message || 'Verification Failed');
                        }
                    } catch (e) {
                        toast.error('Verification error');
                    } finally {
                        setLoading(false);
                    }
                }
            });

        } catch (err: any) {
            console.error('Funding error:', err)
            const msg = err.message || 'An error occurred connecting to Interswitch.'
            setError(msg)
            toast.error(msg)
            setLoading(false)
        }
    }

    // Cost Breakdown display (Interswitch 1.5% fee calculation for transparency)
    const numAmount = Number(amount.replace(/,/g, '')) || 0
    const rawFee = numAmount * 0.015
    const iswFee = Math.min(rawFee, 2000) // Interswitch caps at ₦2000
    const totalCharge = fundingSource === 'wallet' ? numAmount : (numAmount + iswFee)

    const executeWalletFunding = async (pin: string) => {
        setPinModalOpen(false)
        setLoading(true)
        try {
            const res = await fetch(`/api/withdraw?action=fund-jar-from-wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: currentUser?.uid,
                    pin,
                    jarId: jar.id,
                    jarName: jar.name,
                    amount: numAmount
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Jar funded from wallet successfully!')
                onClose()
            } else {
                toast.error(data.message || 'Funding failed')
            }
        } catch (e) {
            toast.error('Network error occurred.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] animate-fade-in-up scrollbar-hide">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <WalletPinModal 
                        isOpen={pinModalOpen} 
                        onClose={() => setPinModalOpen(false)} 
                        onSuccess={executeWalletFunding}
                        title="Authorise Payment"
                        subtitle={`Confirm payment of ₦${numAmount.toLocaleString()} to ${jar.name}`}
                        onlyCollect={true}
                        isExternalLoading={loading}
                    />
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Coins size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Fund Jar</h2>
                            <p className="text-xs text-slate-500">{jar.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleFund} className="p-6">
                    {/* Source Selector */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
                        <button type="button" onClick={() => setFundingSource('interswitch')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${fundingSource === 'interswitch' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <CreditCard size={14} /> Card / ISW
                        </button>
                        <button type="button" onClick={() => setFundingSource('wallet')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${fundingSource === 'wallet' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Wallet size={14} /> My Wallet
                        </button>
                    </div>

                    {fundingSource === 'wallet' && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
                             <span className="text-xs font-bold text-emerald-700">Wallet Balance</span>
                             <span className="text-sm font-black text-emerald-900">₦{(profile?.walletBalance || 0).toLocaleString()}</span>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Contribution Amount (₦)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₦</span>
                            <input 
                                type="text"
                                required
                                value={amount}
                                onChange={e => {
                                    // Strip non-digits and format with commas
                                    const val = e.target.value.replace(/\D/g, '')
                                    setAmount(val ? Number(val).toLocaleString() : '')
                                }}
                                placeholder="50,000"
                                className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-xl font-black text-slate-900 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Breakdown */}
                    {numAmount > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Contribution</span>
                                <span className="font-bold text-slate-900">₦{numAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                 <span className="text-slate-500 flex items-center gap-1">
                                    {fundingSource === 'wallet' ? 'Service Fee (Internal)' : 'Interswitch Fee (1.5%)'}
                                </span>
                                <span className="font-bold text-slate-900">
                                    {fundingSource === 'wallet' ? '₦0' : `₦${iswFee.toLocaleString()}`}
                                </span>
                            </div>
                            <div className="h-px w-full bg-slate-200 my-2" />
                            <div className="flex justify-between text-base">
                                <span className="font-bold text-slate-900">Total charge</span>
                                <span className="font-black text-emerald-600">₦{totalCharge.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Security Notice */}
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6">
                        <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-800 leading-relaxed font-medium">
                            Secured by Interswitch. Your funds go directly into an escrow vault and require <strong className="font-black text-emerald-900">100% unanimous approval</strong> to be released.
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button 
                        type="submit"
                        disabled={loading || numAmount <= 0}
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-base shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 size={20} className="animate-spin" /> Processing Payment...</>
                        ) : fundingSource === 'wallet' ? (
                            <><ShieldCheck size={20} /> Pay from Wallet</>
                        ) : (
                            <><CreditCard size={20} /> Pay with Interswitch WebPAY</>
                        )}
                    </button>
                    
                    <div className="mt-4 flex items-center justify-center gap-2 opacity-50">
                        <Lock size={12} className="text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">PCI-DSS Level 1 Secure</span>
                    </div>
                </form>
            </div>
        </div>
    )
}
