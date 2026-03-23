/**
 * AjoRotationPanel
 *
 * Shown inside GroupManagement for Traditional/Ajo jars.
 * Displays the current payout rotation queue and lets the creator
 * drag-reorder members when rotationMethod === 'creator'.
 *
 * Also shows whose turn it currently is and how many rounds are done.
 */
import { useState } from 'react';
import { Crown, GripVertical, CheckCircle, Clock, RefreshCcw, ArrowRight } from 'lucide-react';
import { setAjoRotationOrder } from '../lib/db';
import { Jar } from '../lib/db';

interface Member {
    uid: string;
    name: string;
    initials: string;
}

interface Props {
    jar: Jar;
    members: Member[];           // Resolved member list (uid → name/initials)
    isCreator: boolean;
    onRequestPayout: () => void; // Opens WithdrawalRequestModal for the turn-holder
    currentUserId: string;
}

export default function AjoRotationPanel({ jar, members, isCreator, onRequestPayout, currentUserId }: Props) {
    const {
        rotationMethod = 'creator',
        rotationOrder = [],
        currentRound = 0,
        disbursedRounds = 0,
        contributionAmount = 0,
    } = jar;

    // Build ordered display list from rotationOrder (fall back to members order)
    const orderedMembers: Member[] = rotationOrder.length > 0
        ? rotationOrder.map(uid => members.find(m => m.uid === uid) ?? { uid, name: uid, initials: '?' })
        : members;

    const [localOrder, setLocalOrder] = useState<Member[]>(orderedMembers);
    const [dragging, setDragging] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isCreatorMethod = rotationMethod === 'creator';
    const orderNeedsSet = isCreatorMethod && rotationOrder.length === 0 && members.length > 0;

    const turnHolderUid = rotationOrder[currentRound] ?? null;
    const isMyTurn = turnHolderUid === currentUserId;
    const totalMembers = members.length;
    const allDisbursed = disbursedRounds >= totalMembers && totalMembers > 0;

    // ── Drag-to-reorder helpers ──────────────────────────────────────────
    const handleDragStart = (idx: number) => setDragging(idx);
    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (dragging === null || dragging === idx) return;
        const updated = [...localOrder];
        const [moved] = updated.splice(dragging, 1);
        updated.splice(idx, 0, moved);
        setLocalOrder(updated);
        setDragging(idx);
    };
    const handleDrop = () => setDragging(null);

    const handleSaveOrder = async () => {
        setSaving(true);
        await setAjoRotationOrder(jar.id, localOrder.map(m => m.uid));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="mt-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                        <RefreshCcw size={14} className="text-blue-900" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">Ajo Rotation Queue</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    {disbursedRounds} / {totalMembers} rounds paid
                </span>
            </div>

            {/* Rotation method badge */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Method:</span>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${rotationMethod === 'creator' ? 'bg-blue-100 text-blue-800' :
                        rotationMethod === 'random' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-indigo-100 text-indigo-800'
                    }`}>
                    {rotationMethod === 'creator' ? '👑 Creator Sets Order' :
                        rotationMethod === 'random' ? '🎲 Random Draw' :
                            '📋 Join Order'}
                </span>
            </div>

            {/* "Order not set yet" prompt for creator-method jars */}
            {orderNeedsSet && isCreator && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                    <p className="text-sm font-bold text-amber-900 mb-1">Set the payout order</p>
                    <p className="text-xs text-amber-700">Drag members below into the order you want them to receive their payout.</p>
                </div>
            )}

            {/* All disbursed banner */}
            {allDisbursed && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                    <p className="text-sm font-bold text-emerald-800">All rounds complete — every member has received their payout!</p>
                </div>
            )}

            {/* It's your turn banner */}
            {isMyTurn && !allDisbursed && (
                <div className="bg-blue-900 rounded-2xl p-4 mb-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1">
                        <p className="text-xs font-black text-blue-300 uppercase tracking-wider mb-1">🎉 It's Your Turn!</p>
                        <p className="text-white font-bold text-sm">
                            You're next to receive {contributionAmount > 0 ? `₦${(contributionAmount * totalMembers).toLocaleString()}` : 'the pot'}.
                        </p>
                        <p className="text-blue-300 text-xs mt-0.5">Submit your bank details to request the payout.</p>
                    </div>
                    <button
                        onClick={onRequestPayout}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-blue-900 text-sm font-black shadow-lg hover:-translate-y-0.5 transition-transform whitespace-nowrap"
                    >
                        Request Payout <ArrowRight size={14} />
                    </button>
                </div>
            )}

            {/* Rotation list */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {(isCreatorMethod && isCreator && !allDisbursed ? localOrder : orderedMembers).map((member, idx) => {
                    const isPaid = idx < disbursedRounds;
                    const isCurrent = idx === currentRound && !allDisbursed;
                    const canDrag = isCreatorMethod && isCreator && !allDisbursed;

                    return (
                        <div
                            key={member.uid}
                            draggable={canDrag}
                            onDragStart={() => canDrag && handleDragStart(idx)}
                            onDragOver={e => canDrag && handleDragOver(e, idx)}
                            onDrop={handleDrop}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors
                                ${isCurrent ? 'bg-blue-50' : isPaid ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}
                                ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
                                ${dragging === idx ? 'opacity-50 scale-[0.98]' : ''}
                            `}
                        >
                            {/* Drag handle */}
                            {canDrag && <GripVertical size={14} className="text-slate-300 shrink-0" />}

                            {/* Position number */}
                            <span className={`text-xs font-black w-6 text-center shrink-0 ${isCurrent ? 'text-blue-900' : 'text-slate-400'}`}>
                                {idx + 1}
                            </span>

                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-black
                                ${isPaid ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                                    isCurrent ? 'bg-gradient-to-br from-blue-900 to-blue-700' :
                                        'bg-gradient-to-br from-slate-400 to-slate-500'}`}
                            >
                                {member.initials}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>{member.name}</p>
                                {isPaid && <p className="text-[10px] text-emerald-600 font-bold">✓ Paid out</p>}
                            </div>

                            {/* Status badge */}
                            {isPaid ? (
                                <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                            ) : isCurrent ? (
                                <span className="flex items-center gap-1 text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full shrink-0">
                                    <Clock size={10} /> Current
                                </span>
                            ) : (
                                <Crown size={13} className="text-slate-300 shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Save order button */}
            {isCreatorMethod && isCreator && !allDisbursed && (
                <button
                    onClick={handleSaveOrder}
                    disabled={saving}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white text-sm font-bold shadow-md shadow-blue-900/20 disabled:opacity-50 transition-all"
                >
                    {saving ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
                    ) : saved ? (
                        <><CheckCircle size={14} /> Order Saved!</>
                    ) : (
                        'Save Payout Order'
                    )}
                </button>
            )}
        </div>
    );
}
