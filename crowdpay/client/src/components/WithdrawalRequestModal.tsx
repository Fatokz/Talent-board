/**
 * WithdrawalRequestModal
 *
 * Used by BOTH jar types to submit a payout request:
 *  - Ajo (rotating): shown to the turn-holder when their cycle is complete
 *  - Goal-based: shown to any member when goal is reached and they want to request withdrawal
 */
import { useState } from 'react';
import { X, CheckCircle, Info, FileText, Wallet, Store, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import WalletPinModal from './WalletPinModal';
import toast from 'react-hot-toast';
import { finalizeJarPayout } from '../lib/db';

export interface WithdrawalRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    jarId: string;
    jarName: string;
    jarCategory: string;
    amount: number;
    totalVoters: number;
    jarType: 'solo' | 'collaborative';
    type: 'ajo_rotation' | 'goal_withdrawal';
    round?: number;
    linkedVendorId?: string;
}

function fmtMoney(n: number) { return `₦${n.toLocaleString()}`; }

export default function WithdrawalRequestModal({
    isOpen, onClose,
    jarId, jarName, jarCategory,
    amount, totalVoters, jarType,
    type, round, linkedVendorId
}: WithdrawalRequestModalProps) {
    const { currentUser } = useAuth();

    const [reason, setReason] = useState('');
    const [destinationType, setDestinationType] = useState<'internal_wallet' | 'vendor'>(linkedVendorId ? 'vendor' : 'internal_wallet');
    const [vendorId, setVendorId] = useState(linkedVendorId ?? '');
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [pinModalOpen, setPinModalOpen] = useState(false);

    if (!isOpen) return null;

    const isAjo = type === 'ajo_rotation';

    const handleClose = () => {
        setReason(''); setVendorId(''); setDestinationType('internal_wallet');
        setSuccess(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (destinationType === 'vendor' && !vendorId.trim()) {
            alert('Please provide a Vendor ID');
            return;
        }

        setPinModalOpen(true);
    };

    const executeRequest = async (pin: string) => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/withdraw?action=jar-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: currentUser.uid,
                    pin,
                    jarId,
                    jarName,
                    jarCategory,
                    amount,
                    reason,
                    destinationType,
                    vendorId,
                    totalVoters: jarType === 'solo' ? 0 : totalVoters,
                    jarType,
                    type,
                    round
                })
            });

            const data = await res.json();
            if (data.success) {
                // SOLO JAR AUTO-PAYOUT TRIGGER
                // If totalVoters is 0, the request is created as 'approved'. 
                // We must trigger the payout execution manually since there's no voting path.
                if (totalVoters === 0 && data.requestId) {
                    try {
                        await finalizeJarPayout(jarId, amount, destinationType, vendorId);
                        toast.success('Funds distributed successfully');
                    } catch (payoutErr) {
                        console.error('Auto-payout trigger failed:', payoutErr);
                    }
                }

                setLoading(false);
                setSuccess(true);
            } else {
                toast.error(data.message || 'Failed to submit request');
                setLoading(false);
            }
        } catch (err) {
            console.error('Failed to create withdrawal request', err);
            toast.error('Network error occurred.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <WalletPinModal 
                isOpen={pinModalOpen} 
                onClose={() => setPinModalOpen(false)} 
                onSuccess={(p) => { setPinModalOpen(false); executeRequest(p); }}
                title="Authorise Request"
                subtitle={`Enter your 4-digit PIN to request this ${fmtMoney(amount)} payout.`}
                onlyCollect={true}
                isExternalLoading={loading}
            />
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh] flex flex-col scrollbar-hide">
                <div className="h-1 bg-gradient-to-r from-blue-900 via-blue-500 to-emerald-500 shrink-0" />

                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">
                            {isAjo ? `Request Payout — Round ${(round ?? 0) + 1}` : 'Request Withdrawal'}
                        </h2>
                        <p className="text-sm text-slate-500">{jarName}</p>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <X size={16} className="text-slate-600" />
                    </button>
                </div>

                {success ? (
                    <div className="p-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                            <CheckCircle size={32} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Request Submitted!</h3>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-8">
                            {jarType === 'solo' 
                                ? "Auto-approved since this is a solo jar. Funds will be released to your destination." 
                                : `All ${totalVoters} group members have been notified and must approve before funds are released.`}
                        </p>
                        <button onClick={handleClose}
                            className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md transition-all active:scale-95">
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount to receive</span>
                            <div className="flex flex-col items-end">
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{fmtMoney(amount)}</p>
                                <div className="mt-2 space-y-1 text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Gross Amount: {fmtMoney(amount)}
                                    </p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                        Processing Fee (3%): -{fmtMoney(amount * 0.03)}
                                    </p>
                                    <div className="pt-1 border-t border-slate-100">
                                        <p className="text-[11px] font-black text-blue-900 uppercase">
                                            Net Payout: {fmtMoney(amount * 0.97)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3">
                            <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-blue-800 leading-relaxed">
                                {jarType === 'solo'
                                    ? 'Submit your destination details below. Since this is a solo jar, it will be auto-approved.'
                                    : `It's time! Submit your payout destination. All ${totalVoters} group members must approve before funds are released.`}
                            </p>
                        </div>

                        {/* Destination Toggle */}
                        <div>
                            <p className="text-xs font-bold text-slate-700 mb-2">Payout Destination (Phase 3)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setDestinationType('internal_wallet')}
                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${destinationType === 'internal_wallet' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                    <Wallet size={16} className={destinationType === 'internal_wallet' ? 'text-blue-600' : ''} />
                                    <span className="text-xs font-bold">My Wallet</span>
                                </button>
                                <button type="button" onClick={() => setDestinationType('vendor')}
                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${destinationType === 'vendor' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                    <Store size={16} className={destinationType === 'vendor' ? 'text-amber-500' : ''} />
                                    <span className="text-xs font-bold">Pay Vendor</span>
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Input */}
                        {destinationType === 'vendor' && (
                            <div className="animate-fade-in-up">
                                <label className="flex items-center justify-between text-sm font-bold text-slate-700 mb-1.5">
                                    <span className="flex items-center gap-1.5"><Store size={14} className="text-slate-400" /> Vendor ID</span>
                                    <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><QrCode size={10} /> Scan QR</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={vendorId}
                                    onChange={e => setVendorId(e.target.value)}
                                    placeholder="e.g. VEND_9823XJS"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-bold text-slate-900 placeholder:text-slate-400 uppercase"
                                />
                                <p className="text-[10px] text-slate-500 mt-2 ml-1">The funds will skip your wallet and go straight to the vendor.</p>
                            </div>
                        )}

                        {destinationType === 'internal_wallet' && (
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl animate-fade-in-up">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><Wallet size={14} className="text-blue-600" /></div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">CrowdPay Wallet</p>
                                        <p className="text-[10px] text-slate-500">Funds will instantly drop in your dashboard wallet.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                                <FileText size={13} className="text-slate-400" /> Request Reason
                            </label>
                            <textarea
                                required
                                rows={2}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder={isAjo ? 'My turn in the rotation.' : 'Payment for school fees.'}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 transition-all font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={handleClose}
                                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 transition-all flex items-center gap-2 text-sm shadow-md active:scale-95">
                                {loading && <div className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />}
                                {loading ? 'Submitting…' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
