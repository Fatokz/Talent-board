import { useState, useEffect } from 'react'
import {
    ArrowDownLeft, ArrowUpRight, Search, Download,
    CheckCircle, Clock, AlertCircle, TrendingDown, TrendingUp, BookOpen, Menu, Loader2, Coins, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { db } from '../lib/firebase'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { Transaction } from '../types'

function fmtMoney(n: number) { return `₦${n.toLocaleString()}` }
function fmtDate(date: any) { 
    if (!date) return '...'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleString('en-NG', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }) 
}

const statusMeta = {
    completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    pending_votes: { label: 'Pending Votes', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    approved: { label: 'Approved', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
}

function TransactionDetailModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
    const s = statusMeta[tx.status as keyof typeof statusMeta] || statusMeta.completed
    const isCredit = tx.type === 'deposit' || tx.type === 'jar_contribution'
    const isJar = tx.type === 'jar_contribution' || tx.type === 'jar_withdrawal'
    const StatusIcon = s.icon

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden" />
                
                {/* Receipt Header */}
                <div className="pt-10 pb-8 px-8 text-center border-b border-dashed border-slate-200 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                    
                    <div className={`w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-xl ${
                        isCredit && tx.type !== 'jar_contribution' ? 'bg-gradient-to-br from-emerald-600 to-emerald-500' : 
                        isJar ? 'bg-gradient-to-br from-amber-500 to-amber-400' :
                        'bg-gradient-to-br from-indigo-700 to-indigo-500'
                    }`}>
                        {isCredit && tx.type !== 'jar_contribution' ? <ArrowDownLeft size={32} className="text-white" /> : 
                         isJar ? <Coins size={32} className="text-white" /> :
                         <ArrowUpRight size={32} className="text-white" />}
                    </div>
                    
                    <h2 className={`text-3xl font-black mb-1 ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>{isCredit ? '+' : '−'}{fmtMoney(tx.amount)}</h2>
                    <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${s.cls}`}>
                        <StatusIcon size={12} /> {s.label}
                    </div>
                </div>

                {/* Details List */}
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-y-6 text-sm">
                        <div>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">Transaction Type</p>
                            <p className="font-black text-slate-900 capitalize">{tx.type.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">Date & Time</p>
                            <p className="font-black text-slate-900 text-xs">{fmtDate(tx.timestamp)}</p>
                        </div>
                        
                        <div className="col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">Description</p>
                            <p className="font-bold text-slate-800 leading-relaxed">{tx.description || 'No description provided'}</p>
                        </div>

                        <div className="col-span-2">
                             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">Transaction Reference</p>
                             <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 font-mono text-[11px] text-slate-600">
                                 {tx.reference}
                                 <button onClick={() => {
                                     navigator.clipboard.writeText(tx.reference || '');
                                     toast.success('Reference copied!');
                                 }} className="text-blue-600 hover:text-blue-700 font-bold text-[10px] uppercase">Copy</button>
                             </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex gap-3">
                        <button onClick={() => window.print()} className="flex-1 h-12 rounded-2xl border-2 border-slate-100 font-black text-slate-700 text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            <Download size={16} /> Receipt
                        </button>
                        <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-slate-900 font-black text-white text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TxRow({ tx, onClick }: { tx: Transaction; onClick: () => void }) {
    const s = statusMeta[tx.status as keyof typeof statusMeta] || statusMeta.completed
    const isCredit = tx.type === 'deposit' || tx.type === 'jar_contribution'
    const isJar = tx.type === 'jar_contribution' || tx.type === 'jar_withdrawal'

    return (
        <tr onClick={onClick} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer group">
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                        isCredit ? 'bg-gradient-to-br from-emerald-600 to-emerald-500' : 
                        isJar ? 'bg-gradient-to-br from-amber-500 to-amber-400' :
                        'bg-gradient-to-br from-indigo-700 to-indigo-500'
                    }`}>
                        {isCredit && tx.type !== 'jar_contribution' ? <ArrowDownLeft size={18} className="text-white" /> : 
                         isJar ? <Coins size={18} className="text-white" /> :
                         <ArrowUpRight size={18} className="text-white" />}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{tx.description || 'Transaction'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {tx.type.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-4 text-xs font-mono text-slate-400">{tx.reference?.slice(0, 12)}...</td>
            <td className="px-5 py-4 text-xs text-slate-400">{fmtDate(tx.timestamp)}</td>
            <td className="px-5 py-4 text-right">
                <span className={`font-black text-[15px] tracking-tight ${isCredit ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {isCredit ? '+' : '−'}{fmtMoney(tx.amount)}
                </span>
            </td>
            <td className="px-5 py-4">
                <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${s.cls}`}>
                    <s.icon size={11} /> {s.label}
                </div>
            </td>
        </tr>
    )
}

interface Props { onMenuClick?: () => void }

export default function TransactionLedger({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [loading, setLoading] = useState(true)
    const [txns, setTxns] = useState<Transaction[]>([])
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'jar_contribution' | 'jar_withdrawal'>('all')
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

    useEffect(() => {
        if (!currentUser) return

        const q = query(
            collection(db, 'transactions'),
            where('uid', '==', currentUser.uid),
            orderBy('timestamp', 'desc')
        )

        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Transaction))
            setTxns(list)
            setLoading(false)
        }, (err) => {
            console.error('Ledger Error:', err)
            setLoading(false)
        })

        return () => unsub()
    }, [currentUser])

    const filtered = txns.filter(tx => {
        const q = search.toLowerCase()
        const matchSearch = (tx.description?.toLowerCase().includes(q) || tx.reference?.toLowerCase().includes(q))
        const matchType = typeFilter === 'all' || tx.type === typeFilter
        return matchSearch && matchType
    })

    const totalDeposits = txns.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
    const totalWithdrawals = txns.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Synchronizing Ledger...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-5 shadow-sm sticky top-0 z-20">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Menu size={17} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transaction Ledger</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Your personal record of deposits, contributions and withdrawals.</p>
                        </div>
                    </div>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                        <Download size={14} /> Save Receipt
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { icon: TrendingDown, label: 'Total Funded', value: fmtMoney(totalDeposits), grad: 'from-emerald-700 to-emerald-500' },
                        { icon: TrendingUp, label: 'Total Withdrawn', value: fmtMoney(totalWithdrawals), grad: 'from-indigo-700 to-indigo-500' },
                        { icon: BookOpen, label: 'Ledger Entries', value: txns.length, grad: 'from-blue-900 to-blue-700' },
                        { icon: AlertCircle, label: 'Success Rate', value: '100%', grad: 'from-blue-600 to-blue-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shrink-0 shadow-md`}>
                                <s.icon size={18} className="text-white" />
                            </div>
                            <div className="truncate">
                                <p className="text-lg font-black text-slate-900 truncate">{s.value}</p>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 lg:p-8">
                {/* Filters */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions or reference…"
                            className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-900 focus:ring-4 focus:ring-blue-900/5 transition-all" />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {(['all', 'deposit', 'withdrawal', 'jar_contribution', 'jar_withdrawal'] as const).map(v => (
                            <button key={v} onClick={() => setTypeFilter(v)}
                                className={`whitespace-nowrap px-4 py-2 h-11 rounded-xl border text-sm font-bold transition-all ${typeFilter === v ? 'bg-slate-900 text-white border-transparent shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                {v === 'all' ? 'All' : v === 'deposit' ? 'Deposits' : v === 'withdrawal' ? 'Withdrawals' : v === 'jar_contribution' ? 'Jar Funding' : 'Jar (from Wallet)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                    <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/3">Transaction</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? filtered.map(tx => <TxRow key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />) : (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search size={24} className="text-slate-300" />
                                            </div>
                                            <h4 className="font-black text-slate-900 text-lg mb-1">No transactions found</h4>
                                            <p className="text-sm text-slate-400">Try adjusting your filters or making a deposit.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedTx && <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
        </div>
    )
}

