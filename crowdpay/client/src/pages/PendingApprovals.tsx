import { useState, useEffect } from 'react'
import {
    Clock, CheckCircle, XCircle, AlertCircle,
    Users, FileText, TrendingUp, Bell, Mail, Menu, UserCheck, UserX,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Logo from '../assets/crowdpayplain.png'
import { VotingModalState } from '../types'
import VotingModal from '../components/VotingModal'
import KycBlockerModal from '../components/KycBlockerModal'
import {
    subscribeToUserInvites, subscribeToSentInvites,
    subscribeToUserDoc, UserProfile,
    acceptInvite, declineInvite, Invite,
    subscribeToUserPendingWithdrawals, WithdrawalRequest
} from '../lib/db'
import { useAuth } from '../contexts/AuthContext'

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(ts: number | string) {
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts)
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtDeadline(ts: number | string) {
    const time = typeof ts === 'number' ? ts : new Date(ts).getTime()
    const h = Math.floor((time - Date.now()) / 3600000)
    return h < 24 ? `${h}h left` : `${Math.floor(h / 24)}d left`
}
function fmtMoney(n: number) { return `₦${n.toLocaleString()}` }
function timeAgo(ts: number) {
    const diff = Date.now() - ts
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
}


// ─── approval card (unchanged) ────────────────────────────────────────────────
function ApprovalCard({ a, onVote }: { a: WithdrawalRequest; onVote: () => void }) {
    const votesForCount = Object.values(a.votes || {}).filter(v => v.decision === 'approved').length
    const votesAgainstCount = Object.values(a.votes || {}).filter(v => v.decision === 'declined').length
    const pct = Math.round((votesForCount / a.totalVoters) * 100)
    const urgent = new Date(a.votingDeadline).getTime() - Date.now() < 86400000 * 2
    const tagColor = 'bg-blue-100 text-blue-800' // could be dynamic based on category

    return (
        <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${urgent ? 'border-amber-300 shadow-amber-100' : 'border-slate-200'}`}>
            {urgent && <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-300" />}
            <div className="p-6">
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-900/25 shrink-0">
                        {a.requestedByInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                            <p className="font-black text-slate-900 text-[15px]">{a.requestedByName}</p>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${tagColor}`}>{a.jarName}</span>
                        </div>
                        <p className="text-xs text-slate-400">Requested · {fmtDate(a.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-2xl font-black text-slate-900 tracking-tight">{fmtMoney(a.amount)}</p>
                        {urgent && (
                            <div className="flex items-center gap-1 justify-end mt-1">
                                <AlertCircle size={12} className="text-amber-500" />
                                <span className="text-[11px] font-bold text-amber-600">Urgent · {fmtDeadline(a.votingDeadline)}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{a.reason}</p>
                </div>
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">Consensus Progress</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{votesForCount} / {a.totalVoters}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-gradient-to-r from-blue-900 to-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-4 text-xs font-bold">
                        <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle size={12} /> {votesForCount} approved
                        </span>
                        {votesAgainstCount > 0 && (
                            <span className="text-red-600 flex items-center gap-1">
                                <XCircle size={12} /> {votesAgainstCount} declined
                            </span>
                        )}
                        <span className="text-slate-400 flex items-center gap-1 ml-auto">
                            <Clock size={12} /> {fmtDeadline(a.votingDeadline)}
                        </span>
                    </div>
                </div>
                <button onClick={onVote} 
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black text-sm shadow-lg shadow-blue-900/25 hover:-translate-y-0.5 transition-transform active:scale-95">
                    Review & Vote
                </button>
            </div>
        </div>
    )
}

// ─── invite card ──────────────────────────────────────────────────────────────
function InviteCard({
    invite, mode, currentUserId, onAction, kycVerified, onKycBlocked
}: {
    invite: Invite
    mode: 'received' | 'sent'
    currentUserId: string
    onAction: () => void
    kycVerified?: boolean
    onKycBlocked?: () => void
}) {
    const [declineOpen, setDeclineOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [busy, setBusy] = useState(false)
    const [resolvedInviter, setResolvedInviter] = useState<string | null>(null)
    const [resolvedJar, setResolvedJar] = useState<string | null>(null)

    // Resolve inviterName from Firestore users collection if missing on the invite doc
    useEffect(() => {
        if (invite.inviterName) { setResolvedInviter(invite.inviterName); return }
        if (!invite.inviterId) return
        getDoc(doc(db, 'users', invite.inviterId)).then(snap => {
            if (snap.exists()) {
                const data = snap.data()
                setResolvedInviter(data.fullName || data.displayName || data.email || null)
            }
        })
    }, [invite.inviterId, invite.inviterName])

    // Resolve jarName from Firestore jars collection if missing on the invite doc
    useEffect(() => {
        if (invite.jarName) { setResolvedJar(invite.jarName); return }
        if (!invite.jarId) return
        getDoc(doc(db, 'jars', invite.jarId)).then(snap => {
            if (snap.exists()) setResolvedJar(snap.data().name || null)
        })
    }, [invite.jarId, invite.jarName])

    // Safely convert Firestore Timestamp or plain number to ms
    const inviteTs = (() => {
        const ts = invite.createdAt as unknown
        if (ts && typeof (ts as any).toMillis === 'function') return (ts as any).toMillis() as number
        if (typeof ts === 'number') return ts
        return Date.now()
    })()

    const displayInviter = resolvedInviter ?? invite.inviterName ?? null
    const displayJar = resolvedJar ?? invite.jarName ?? null

    const statusBadge = {
        pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
        accepted: { label: 'Accepted', cls: 'bg-emerald-100 text-emerald-700' },
        declined: { label: 'Declined', cls: 'bg-red-100 text-red-700' },
    }[invite.status]

    const handleAccept = async () => {
        if (kycVerified === false && onKycBlocked) {
            onKycBlocked()
            return
        }
        setBusy(true)
        try {
            await acceptInvite(invite.id, currentUserId)
            onAction()
        } finally { setBusy(false) }
    }

    const handleDecline = async () => {
        setBusy(true)
        try {
            await declineInvite(invite.id, reason || undefined)
            setDeclineOpen(false)
            onAction()
        } finally { setBusy(false) }

    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Accent bar by status */}
            <div className={`h-1 ${invite.status === 'accepted' ? 'bg-emerald-400' : invite.status === 'declined' ? 'bg-red-400' : 'bg-blue-900'}`} />
            <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                        {(displayInviter ?? displayJar ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="font-black text-slate-900 text-[15px] truncate">
                                {mode === 'received'
                                    ? <><strong>{displayInviter ?? 'Someone'}</strong> invited you</>
                                    : <>You invited <strong>{invite.inviteeName ?? invite.inviteeEmail}</strong></>
                                }
                            </p>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge.cls}`}>
                                {statusBadge.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail size={10} />
                            {displayJar ? `"${displayJar}" jar` : `Jar invitation`}
                            &nbsp;·&nbsp;{timeAgo(inviteTs)}
                        </p>
                    </div>
                </div>

                {/* Decline reason (shown for creator on declined invites) */}
                {mode === 'sent' && invite.status === 'declined' && invite.declineReason && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
                        <p className="font-bold text-xs text-red-500 uppercase tracking-wider mb-1">Decline Reason</p>
                        <p>{invite.declineReason}</p>
                    </div>
                )}

                {/* Actions — only for received + pending */}
                {mode === 'received' && invite.status === 'pending' && (
                    <>
                        {!declineOpen ? (
                            <div className="flex gap-3">
                                <button onClick={handleAccept} disabled={busy}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg disabled:opacity-50 transition-all">
                                    <UserCheck size={15} /> Accept
                                </button>
                                <button onClick={() => setDeclineOpen(true)} disabled={busy}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-200 bg-white text-red-500 text-sm font-bold hover:bg-red-50 disabled:opacity-50 transition-colors">
                                    <UserX size={15} /> Decline
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Optional: let them know why you're declining…"
                                    rows={2}
                                    className="w-full resize-none text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 transition-all"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setDeclineOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleDecline} disabled={busy}
                                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors">
                                        {busy ? 'Declining…' : 'Confirm Decline'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// ─── main page ────────────────────────────────────────────────────────────────
type FilterType = 'all' | 'votes' | 'invites-received' | 'invites-sent' | 'urgent'
interface Props { onMenuClick?: () => void }

export default function PendingApprovals({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [kycProfile, setKycProfile] = useState<UserProfile | null>(null)
    const [kycModalOpen, setKycModalOpen] = useState(false)
    const [modal, setModal] = useState<VotingModalState>({ isOpen: false })
    const [activeFilter, setActiveFilter] = useState<FilterType>('all')
    const [receivedInvites, setReceivedInvites] = useState<Invite[]>([])
    const [sentInvites, setSentInvites] = useState<Invite[]>([])
    const [realVotes, setRealVotes] = useState<WithdrawalRequest[]>([])

    const approvals = realVotes;
    const total = approvals.reduce((s, a) => s + a.amount, 0)
    const urgent = approvals.filter(a => new Date(a.votingDeadline).getTime() - Date.now() < 86400000 * 2)
    const pendingReceived = receivedInvites.filter(i => i.status === 'pending')
    const pendingTotal = approvals.length + pendingReceived.length

    // Subscribe to invites and KYC doc
    useEffect(() => {
        if (!currentUser) return
        const unsubUser = subscribeToUserDoc(currentUser.uid, setKycProfile)
        const unsubReceived = subscribeToUserInvites(
            currentUser.email ?? '',
            setReceivedInvites
        )
        const unsubSent = subscribeToSentInvites(
            currentUser.uid,
            setSentInvites
        )
        const unsubVotes = subscribeToUserPendingWithdrawals(
            currentUser.uid,
            setRealVotes
        )
        return () => { 
            unsubUser(); unsubReceived(); unsubSent(); unsubVotes();
        }
    }, [currentUser])

    const filterCards: { key: FilterType; icon: any; label: string; value: string | number; grad: string }[] = [
        { key: 'votes', icon: AlertCircle, label: 'Awaiting Vote', value: approvals.length, grad: 'from-amber-600 to-amber-400' },
        { key: 'urgent', icon: TrendingUp, label: 'Total at Stake', value: `₦${(total / 1000).toFixed(0)}k`, grad: 'from-blue-900 to-blue-700' },
        { key: 'invites-received', icon: Bell, label: 'Invites Received', value: pendingReceived.length, grad: 'from-indigo-700 to-indigo-500' },
        { key: 'invites-sent', icon: Users, label: 'Invites Sent', value: sentInvites.length, grad: 'from-emerald-700 to-emerald-500' },
    ]

    const showVotes = activeFilter === 'all' || activeFilter === 'votes' || activeFilter === 'urgent'
    const showReceived = activeFilter === 'all' || activeFilter === 'invites-received'
    const showSent = activeFilter === 'all' || activeFilter === 'invites-sent'

    const votesToShow = activeFilter === 'urgent'
        ? approvals.filter(a => new Date(a.votingDeadline).getTime() - Date.now() < 86400000 * 2)
        : approvals

    const nothing = (votesToShow.length === 0 || !showVotes)
        && (receivedInvites.length === 0 || !showReceived)
        && (sentInvites.length === 0 || !showSent)

    return (
        <div className="min-h-screen bg-slate-50 font-sans">

            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-5 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-3 mb-3 sm:mb-5">
                    <button onClick={onMenuClick} className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Menu size={15} className="text-slate-600 sm:size-[17px]" />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            Notifications
                            {pendingTotal > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-900 text-white text-[10px] sm:text-xs font-black">
                                    {pendingTotal}
                                </span>
                            )}
                        </h1>
                        <p className="hidden sm:block text-sm text-slate-400 mt-0.5">
                            Vote on withdrawals, manage invitations. 100% consensus required to release funds.
                        </p>
                    </div>
                </div>

                {/* Filter cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {filterCards.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setActiveFilter(prev => prev === s.key ? 'all' : s.key)}
                            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all ${activeFilter === s.key
                                ? 'border-blue-300 bg-blue-50 shadow-sm shadow-blue-100'
                                : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                                }`}>
                            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shrink-0`}>
                                <s.icon size={14} className="sm:size-[18px] text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm sm:text-lg font-black text-slate-900 leading-none mb-1">{s.value}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{s.label}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 sm:space-y-8">

                {/* Urgent banner */}
                {urgent.length > 0 && showVotes && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
                        <AlertCircle size={16} className="text-amber-600 shrink-0" />
                        <p className="text-sm text-amber-900 font-medium">
                            <strong>{urgent.length} withdrawal request{urgent.length > 1 ? 's' : ''}</strong> need{urgent.length === 1 ? 's' : ''} your vote within 48 hours.
                        </p>
                    </div>
                )}

                {/* Withdrawal votes section */}
                {showVotes && (
                    <section>
                        <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp size={13} /> Withdrawal Votes
                        </h2>
                        {votesToShow.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                <CheckCircle size={28} className="text-emerald-400 mx-auto mb-3" />
                                <p className="font-bold text-slate-700">No pending votes</p>
                                <p className="text-sm text-slate-400">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {votesToShow.map(a => (
                                    <ApprovalCard key={a.id} a={a} onVote={() => setModal({ isOpen: true, request: a })} />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Received invites section */}
                {showReceived && (
                    <section>
                        <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Bell size={13} /> Invitations Received
                        </h2>
                        {receivedInvites.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                <Mail size={28} className="text-slate-300 mx-auto mb-3" />
                                <p className="font-bold text-slate-700">No invitations yet</p>
                                <p className="text-sm text-slate-400">When someone invites you to a jar, it'll show here.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {receivedInvites.map(inv => (
                                    <InviteCard key={inv.id} invite={inv} mode="received"
                                        currentUserId={currentUser?.uid ?? ''}
                                        kycVerified={kycProfile?.kycStatus === 'verified'}
                                        onKycBlocked={() => setKycModalOpen(true)}
                                        onAction={() => { }} />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Sent invites section (shows creator responses) */}
                {showSent && (
                    <section>
                        <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users size={13} /> Invitations Sent
                        </h2>
                        {sentInvites.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                <Users size={28} className="text-slate-300 mx-auto mb-3" />
                                <p className="font-bold text-slate-700">No sent invitations</p>
                                <p className="text-sm text-slate-400">Invites you send will appear here along with their responses.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {sentInvites.map(inv => (
                                    <InviteCard key={inv.id} invite={inv} mode="sent"
                                        currentUserId={currentUser?.uid ?? ''}
                                        onAction={() => { }} />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Completely empty state */}
                {nothing && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <CheckCircle size={28} className="text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2">You're All Caught Up</h2>
                        <p className="text-slate-400 max-w-xs mx-auto text-sm">No notifications for this filter. Check another tab or come back later.</p>
                    </div>
                )}
            </div>

            {modal.isOpen && (
                <VotingModal 
                    isOpen={modal.isOpen} 
                    approval={modal.approval} 
                    request={modal.request}
                    onClose={() => setModal({ isOpen: false })} 
                />
            )}
            <KycBlockerModal isOpen={kycModalOpen} onClose={() => setKycModalOpen(false)} />
        </div>
    )
}
