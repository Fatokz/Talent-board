import { useState } from 'react'
import {
    ArrowDownLeft, ArrowUpRight, Search, Filter, Download,
    CheckCircle, Clock, AlertCircle, TrendingDown, TrendingUp, BookOpen, Menu,
} from 'lucide-react'
import { transactions } from '../data/mockData'
import { Transaction } from '../types'

function fmtMoney(n: number) { return `₦${n.toLocaleString()}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) }

const statusMeta = {
    completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    pending_votes: { label: 'Pending Votes', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    approved: { label: 'Approved', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
}

function TxRow({ tx }: { tx: Transaction }) {
    const s = statusMeta[tx.status]
    const deposit = tx.type === 'deposit'

    return (
        <tr className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${deposit ? 'bg-gradient-to-br from-emerald-600 to-emerald-500' : 'bg-gradient-to-br from-indigo-700 to-indigo-500'}`}>
                        {deposit ? <ArrowDownLeft size={18} className="text-white" /> : <ArrowUpRight size={18} className="text-white" />}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">{tx.member}</p>
                        <p className="text-xs text-slate-400">{deposit ? 'Contribution' : 'Withdrawal'}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600 font-medium">{tx.jar}</td>
            <td className="px-5 py-4 text-xs text-slate-400">{fmtDate(tx.date)}</td>
            <td className="px-5 py-4 text-right">
                <span className={`font-black text-[15px] tracking-tight ${deposit ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {deposit ? '+' : '−'}{fmtMoney(tx.amount)}
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
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all')
    const [jarFilter, setJarFilter] = useState<string>('all')

    const uniqueJars = Array.from(new Set(transactions.map(t => t.jar)))

    const filtered = transactions.filter(tx => {
        const q = search.toLowerCase()
        return (tx.member.toLowerCase().includes(q) || tx.jar.toLowerCase().includes(q))
            && (typeFilter === 'all' || tx.type === typeFilter)
            && (jarFilter === 'all' || tx.jar === jarFilter)
    })

    const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
    const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved').reduce((s, t) => s + t.amount, 0)

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-5 shadow-sm sticky top-0 z-20">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Menu size={17} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transaction Ledger</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Full audit trail. Every transaction visible to all members.</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                        <Download size={14} /> Export CSV
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { icon: TrendingDown, label: 'Total Deposited', value: fmtMoney(totalDeposits), grad: 'from-emerald-700 to-emerald-500' },
                        { icon: TrendingUp, label: 'Total Withdrawn', value: fmtMoney(totalWithdrawals), grad: 'from-indigo-700 to-indigo-500' },
                        { icon: BookOpen, label: 'Total Records', value: transactions.length, grad: 'from-blue-900 to-blue-700' },
                        { icon: AlertCircle, label: 'Pending Votes', value: transactions.filter(t => t.status === 'pending_votes').length, grad: 'from-amber-600 to-amber-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shrink-0 shadow-md`}>
                                <s.icon size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-slate-900">{s.value}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8">
                {/* Filters */}
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member or jar…"
                            className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-900 transition-colors" />
                    </div>
                    <div className="flex gap-2 items-center">
                        <select
                            value={jarFilter}
                            onChange={e => setJarFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-colors"
                        >
                            <option value="all">All Jars</option>
                            {uniqueJars.map(jarName => (
                                <option key={jarName} value={jarName}>{jarName}</option>
                            ))}
                        </select>

                        {(['all', 'deposit', 'withdrawal'] as const).map(v => (
                            <button key={v} onClick={() => setTypeFilter(v)}
                                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all capitalize ${typeFilter === v ? 'bg-gradient-to-r from-blue-900 to-blue-700 text-white border-transparent shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                {v === 'all' ? 'All' : v === 'deposit' ? 'Deposits' : 'Withdrawals'}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600">
                        <Filter size={13} /> Filter
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    {['Member', 'Jar', 'Date', 'Amount', 'Status'].map((h, i) => (
                                        <th key={h} className={`px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? filtered.map(tx => <TxRow key={tx.id} tx={tx} />) : (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                                            <Search size={36} className="mx-auto mb-3" />
                                            <p className="font-bold text-slate-600 text-base">No transactions found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Legend */}
                    <div className="px-5 py-4 border-t border-slate-100 flex gap-6 flex-wrap">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Deposit (Contribution)
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Withdrawal (Unanimous approved)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
