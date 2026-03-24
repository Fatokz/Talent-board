import { useState } from 'react'
import { X, Lock, Wallet, ShieldCheck, CreditCard, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function FundWalletModal({ isOpen, onClose }: Props) {
    const { currentUser } = useAuth()
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleFund = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        
        const numAmount = Number(amount.replace(/,/g, ''))
        if (!numAmount || numAmount <= 0) {
            setError('Please enter a valid amount')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/initiate-wallet-funding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: numAmount,
                    uid: currentUser?.uid,
                    email: currentUser?.email || 'test@crowdpay.com'
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to initiate payment')

            const isProd = import.meta.env.PROD
            const actionUrl = isProd 
                ? 'https://webpay.interswitchng.com/paydirect/pay'
                : 'https://qa.interswitchng.com/paydirect/pay'

            const form = document.createElement('form')
            form.method = 'POST'
            form.action = actionUrl
            
            const fields = {
                product_id: data.productId,
                pay_item_id: data.payItemId,
                amount: data.amount,
                currency: data.currency,
                site_redirect_url: data.siteRedirectUrl,
                txn_ref: data.txnRef,
                hash: data.hash,
                cust_email: data.email,
                cust_name: currentUser?.displayName || 'CrowdPay Member'
            }

            Object.entries(fields).forEach(([key, value]) => {
                const input = document.createElement('input')
                input.type = 'hidden'
                input.name = key
                input.value = String(value)
                form.appendChild(input)
            })

            document.body.appendChild(form)
            form.submit()

        } catch (err: any) {
            console.error('Funding error:', err)
            setError(err.message || 'An error occurred connecting to Interswitch.')
            setLoading(false)
        }
    }

    const numAmount = Number(amount.replace(/,/g, '')) || 0
    const rawFee = numAmount * 0.015
    const iswFee = Math.min(rawFee, 2000)
    const totalCharge = numAmount + iswFee

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Wallet size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Fund Wallet</h2>
                            <p className="text-xs text-slate-500">Secure Interswitch Gateway</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleFund} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Deposit Amount (₦)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₦</span>
                            <input 
                                type="text"
                                required
                                value={amount}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    setAmount(val ? Number(val).toLocaleString() : '')
                                }}
                                placeholder="50,000"
                                className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-xl font-black text-slate-900 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {numAmount > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Deposit</span>
                                <span className="font-bold text-slate-900">₦{numAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-1">Interswitch Fee (1.5%)</span>
                                <span className="font-bold text-slate-900">₦{iswFee.toLocaleString()}</span>
                            </div>
                            <div className="h-px w-full bg-slate-200 my-2" />
                            <div className="flex justify-between text-base">
                                <span className="font-bold text-slate-900">Total charge</span>
                                <span className="font-black text-blue-600">₦{totalCharge.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                        <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 leading-relaxed font-medium">
                            Secured by Interswitch. Your funds will instantly reflect in your CrowdPay Wallet for upcoming Ajo cycles and Goal Jars.
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading || numAmount <= 0}
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black text-base shadow-lg shadow-blue-900/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader2 size={20} className="animate-spin" /> Preparing Checkout...</> : <><CreditCard size={20} /> Proceed to Interswitch</>}
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
