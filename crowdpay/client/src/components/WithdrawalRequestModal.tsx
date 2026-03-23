/**
 * WithdrawalRequestModal
 *
 * Used by BOTH jar types to submit a payout request:
 *  - Ajo (rotating): shown to the turn-holder when their cycle is complete
 *  - Goal-based: shown to any member when goal is reached and they want to request withdrawal
 *
 * The modal collects:
 *  1. Reason / purpose of withdrawal
 *  2. Bank details (Bank Name, Account Number, Account Name)
 *     → stored on WithdrawalRequest for voters to see and for Interswitch at payout
 */
import { useState } from 'react';
import { X, Building2, CreditCard, User, FileText, CheckCircle, Info } from 'lucide-react';
import { createWithdrawalRequest } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';

export interface WithdrawalRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Jar details */
    jarId: string;
    jarName: string;
    jarCategory: string;
    /** Amount to be withdrawn (full pot for Ajo, full raised for goal-based) */
    amount: number;
    /** Number of OTHER members who will vote (total members - 1) */
    totalVoters: number;
    /** 'ajo_rotation' triggers round advance after payout; 'goal_withdrawal' is a one-time release */
    type: 'ajo_rotation' | 'goal_withdrawal';
    /** For Ajo: which round number this payout is for (shown in the modal) */
    round?: number;
}

function fmtMoney(n: number) { return `₦${n.toLocaleString()}`; }

export default function WithdrawalRequestModal({
    isOpen, onClose,
    jarId, jarName, jarCategory,
    amount, totalVoters,
    type, round,
}: WithdrawalRequestModalProps) {
    const { currentUser } = useAuth();

    const [reason, setReason] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const isAjo = type === 'ajo_rotation';

    const handleClose = () => {
        setReason(''); setBankName(''); setAccountNumber(''); setAccountName('');
        setSuccess(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const initials = (currentUser.displayName ?? 'U')
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        try {
            setLoading(true);
            // Voting deadline: 72 hours from now
            const votingDeadline = Date.now() + 72 * 60 * 60 * 1000;

            await createWithdrawalRequest({
                jarId,
                jarName,
                jarCategory,
                requestedBy: currentUser.uid,
                requestedByName: currentUser.displayName ?? 'Unknown',
                requestedByInitials: initials,
                amount,
                reason,
                bankName,
                accountNumber,
                accountName,
                totalVoters,
                type,
                ...(round !== undefined && { round }),
                votingDeadline,
            });

            setLoading(false);
            setSuccess(true);
        } catch (err) {
            console.error('Failed to create withdrawal request', err);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col">
                {/* Top accent */}
                <div className="h-1 bg-gradient-to-r from-blue-900 via-blue-500 to-emerald-500 shrink-0" />

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">
                            {isAjo ? `Request Payout — Round ${(round ?? 0) + 1}` : 'Request Withdrawal'}
                        </h2>
                        <p className="text-sm text-slate-500">{jarName}</p>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <X size={16} className="text-slate-600" />
                    </button>
                </div>

                {success ? (
                    /* Success state */
                    <div className="p-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                            <CheckCircle size={32} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Request Submitted!</h3>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                            {totalVoters === 0 
                                ? "Your request has been auto-approved since this is a solo jar. Funds will be released to your account." 
                                : `All ${totalVoters} group members have been notified and must approve before funds are released.`}
                        </p>
                        <button onClick={handleClose}
                            className="mt-8 px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-bold text-sm">
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                        {/* Amount chip */}
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                            <span className="text-sm text-slate-500">Amount to receive</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{fmtMoney(amount)}</span>
                        </div>

                        {/* Info notice */}
                        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                            <Info size={14} className="text-blue-700 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                {totalVoters === 0
                                    ? (isAjo ? 'Submit your bank details below. As a solo saver, this will be auto-approved.' : 'Goal reached! Submit your bank details. As a solo jar, this will be auto-approved instantly.')
                                    : (isAjo
                                        ? `It's your turn! Submit your bank details below. All ${totalVoters} other members will vote to approve.`
                                        : `Goal reached! Submit your bank details. All ${totalVoters} members must approve before funds are sent.`)}
                            </p>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                                <FileText size={13} className="text-slate-400" /> Reason / Purpose
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder={isAjo
                                    ? 'e.g. My turn in the rotation — per our group agreement.'
                                    : 'e.g. Payment for school fees for the new term.'}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-medium text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed"
                            />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 pt-1">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">Payout Bank Details</p>
                        </div>

                        {/* Bank Name */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                                <Building2 size={13} className="text-slate-400" /> Bank Name
                            </label>
                            <select
                                required
                                value={bankName}
                                onChange={e => setBankName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 transition-all font-medium text-slate-900"
                            >
                                <option value="">Select bank…</option>
                                {[
                                    'Access Bank', 'First Bank', 'GT Bank', 'UBA',
                                    'Zenith Bank', 'Opay', 'Kuda Bank', 'Moniepoint',
                                    'Fidelity Bank', 'Sterling Bank', 'Polaris Bank',
                                    'Wema Bank', 'Stanbic IBTC', 'Union Bank',
                                ].map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>

                        {/* Account Number */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                                <CreditCard size={13} className="text-slate-400" /> Account Number
                            </label>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                                maxLength={10}
                                value={accountNumber}
                                onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10-digit account number"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-medium text-slate-900 placeholder:text-slate-400 tracking-widest"
                            />
                        </div>

                        {/* Account Name */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                                <User size={13} className="text-slate-400" /> Account Name
                            </label>
                            <input
                                required
                                type="text"
                                value={accountName}
                                onChange={e => setAccountName(e.target.value)}
                                placeholder="As it appears on your bank account"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={handleClose}
                                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-bold shadow-md shadow-blue-900/20 disabled:opacity-50 transition-all flex items-center gap-2">
                                {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                                {loading ? 'Submitting…' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
