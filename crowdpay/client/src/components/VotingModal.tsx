import { useState } from 'react'
import { X, CheckCircle, XCircle, Lock, Users, Clock, AlertTriangle, Building2, CreditCard, User } from 'lucide-react'
import Logo from '../assets/crowdpayplain.png'
import { JarTemplate, PendingApproval } from '../types'
import { WithdrawalRequest, castWithdrawalVote } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'

interface Props {
    isOpen: boolean
    // Legacy mock-data path (PendingApprovals page)
    jar?: JarTemplate
    approval?: PendingApproval
    // Real Firestore path
    request?: WithdrawalRequest
    onClose: () => void
}

function fmtMoney(n: number) { return `₦${n.toLocaleString()}` }

export default function VotingModal({ isOpen, jar, approval, request, onClose }: Props) {
    const { currentUser } = useAuth()
    const [vote, setVote] = useState<'approve' | 'decline' | null>(null)
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    if (!isOpen) return null

    // ── Resolve data from either source ─────────────────────────────────
    const title = request?.jarName ?? (approval ? approval.jar : jar?.name ?? '')
    const amount = request?.amount ?? (approval ? approval.amount : jar?.raised ?? 0)
    const desc = request?.reason ?? approval?.reason ?? 'Unanimous withdrawal request from group members.'
    const votesFor = request
        ? Object.values(request.votes).filter(v => v.decision === 'approved').length
        : (approval?.votesFor ?? 0)
    const total = request?.totalVoters ?? (approval?.totalVoters ?? (jar?.members ?? 0))
    const pct = total > 0 ? (votesFor / total) * 100 : 0

    // Bank details (only on real requests)
    const bankDetails = request ? {
        bankName: request.bankName,
        accountNumber: request.accountNumber,
        accountName: request.accountName,
    } : null

    const canSubmit = vote && (vote !== 'decline' || reason.trim())

    const handleSubmit = async () => {
        if (!canSubmit || !currentUser) return
        setLoading(true)

        if (request) {
            // Real Firestore vote
            try {
                await castWithdrawalVote(
                    request.id,
                    currentUser.uid,
                    vote === 'approve' ? 'approved' : 'declined',
                    vote === 'decline' ? reason : undefined
                )
            } catch (err) {
                console.error('Vote failed', err)
            }
        } else {
            // Mock delay for legacy path
            await new Promise(r => setTimeout(r, 1200))
        }

        setLoading(false)
        setDone(true)
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 font-sans">
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_40px_100px_rgba(15,23,42,0.4)] overflow-hidden max-h-[92vh] flex flex-col">
                <div className="h-1 bg-gradient-to-r from-blue-900 via-blue-500 to-emerald-500 shrink-0" />

                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center shrink-0">
                            <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Withdrawal Vote</h2>
                            <p className="text-sm text-slate-400">{title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                {done ? (
                    <div className="px-7 py-12 text-center">
                        <div className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center shadow-xl ${vote === 'approve' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/35' : 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/35'}`}>
                            {vote === 'approve' ? <CheckCircle size={30} className="text-white" /> : <XCircle size={30} className="text-white" />}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">
                            {vote === 'approve' ? 'Vote Recorded — Approved!' : 'Vote Recorded — Declined'}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-8">
                            {vote === 'approve'
                                ? 'Your approval has been recorded. Funds will release once all remaining members vote.'
                                : 'Your decline with reason has been logged and shared with all group members.'}
                        </p>
                        <button onClick={onClose} className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-bold text-sm shadow-md shadow-blue-900/30">Done</button>
                    </div>
                ) : (
                    <div className="px-7 py-6 overflow-y-auto flex-1">
                        {/* Details */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5">
                            <div className="flex justify-between mb-4">
                                <span className="text-xs text-slate-400 font-semibold">Withdrawal Amount</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tight">{fmtMoney(amount)}</span>
                            </div>
                            <div className="mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Reason</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <div className="flex items-center gap-1.5"><Users size={12} className="text-blue-900" /><span className="font-bold text-slate-700">Consensus</span></div>
                                    <span className="font-black text-slate-900">{votesFor} / {total}</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-900 to-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* ── Bank Payout Details (real requests only) ── */}
                        {bankDetails && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
                                <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider mb-3">Payout Bank Details</p>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <Building2 size={13} className="text-blue-600 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-blue-400 font-semibold">Bank</p>
                                            <p className="text-sm font-bold text-blue-900">{bankDetails.bankName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <CreditCard size={13} className="text-blue-600 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-blue-400 font-semibold">Account Number</p>
                                            <p className="text-sm font-bold text-blue-900 tracking-widest">{bankDetails.accountNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <User size={13} className="text-blue-600 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-blue-400 font-semibold">Account Name</p>
                                            <p className="text-sm font-bold text-blue-900">{bankDetails.accountName}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-blue-600 mt-3 font-medium">
                                    Verify these details before approving. Funds will be sent here upon unanimous approval.
                                </p>
                            </div>
                        )}

                        {/* Vote options */}
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Your Vote</p>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            {[
                                { v: 'approve' as const, icon: CheckCircle, label: 'Approve', sub: 'Release funds', active: 'border-emerald-500 bg-emerald-50', icon_active: 'bg-gradient-to-br from-emerald-500 to-emerald-700', text_active: 'text-emerald-700' },
                                { v: 'decline' as const, icon: XCircle, label: 'Decline', sub: 'Block release', active: 'border-red-400 bg-red-50', icon_active: 'bg-gradient-to-br from-red-500 to-red-700', text_active: 'text-red-700' },
                            ].map(o => {
                                const active = vote === o.v
                                return (
                                    <button key={o.v} onClick={() => setVote(o.v)}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all ${active ? o.active : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? o.icon_active : 'bg-slate-100'}`}>
                                            <o.icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
                                        </div>
                                        <div className="text-center">
                                            <p className={`font-black text-sm ${active ? o.text_active : 'text-slate-600'}`}>{o.label}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{o.sub}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Decline reason */}
                        {vote === 'decline' && (
                            <div className="mb-5">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                                    <AlertTriangle size={13} className="text-amber-500" /> Reason for declining (required — shared with group)
                                </label>
                                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain your reason clearly…" rows={3}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-sm text-slate-800 resize-none focus:outline-none focus:border-amber-400 transition-colors leading-relaxed" />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-5">
                            <Lock size={13} className="text-blue-900 shrink-0" />
                            <p className="text-xs text-blue-700"><strong>100% consensus required.</strong> All {total} members must vote to release funds.</p>
                        </div>
                        {approval && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-5">
                                <Clock size={13} className="text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-800">Voting deadline: <strong>{new Date(approval.votingDeadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong></p>
                            </div>
                        )}
                        {request && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-5">
                                <Clock size={13} className="text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-800">Voting deadline: <strong>{new Date(request.votingDeadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong></p>
                            </div>
                        )}

                        {/* Submit */}
                        <button onClick={handleSubmit} disabled={!canSubmit || loading}
                            className={`w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2.5 transition-all ${canSubmit && !loading
                                ? vote === 'approve'
                                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
                                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}>
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting vote…</>
                            ) : vote === 'approve' ? (<><CheckCircle size={17} /> Confirm Approval</>) : vote === 'decline' ? (<><XCircle size={17} /> Confirm Decline</>) : 'Select a vote to continue'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
