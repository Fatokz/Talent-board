/**
 * WalletPinModal
 * A secure PIN entry modal with dot-style indicators.
 * Used before any wallet withdrawal action.
 */
import { useState, useRef, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    /** Called when PIN is verified — proceed with your action */
    onSuccess: () => void;
    title?: string;
    subtitle?: string;
}

export default function WalletPinModal({ isOpen, onClose, onSuccess, title = 'Enter Wallet PIN', subtitle = 'Enter your 4-digit PIN to authorise this transaction.' }: Props) {
    const { currentUser } = useAuth();
    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '']);
            setError('');
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return; // only digits
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullPin = pin.join('');
        if (fullPin.length !== 4) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/wallet-pin?action=verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUser?.uid, pin: fullPin }),
            });
            const data = await res.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                const msg = data.message || 'Incorrect PIN. Please try again.'
                setError(msg);
                toast.error(msg);
                setPin(['', '', '', '']);
                setTimeout(() => inputRefs.current[0]?.focus(), 50);
            }
        } catch {
            setError('Network error. Please try again.');
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-900 via-blue-500 to-emerald-500" />

                <div className="p-6">
                    <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <X size={15} className="text-slate-600" />
                    </button>

                    <div className="flex flex-col items-center mb-6 mt-1">
                        <div className="w-14 h-14 rounded-2xl bg-blue-950 flex items-center justify-center mb-3 shadow-lg shadow-blue-900/30">
                            <ShieldCheck size={28} className="text-white" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900">{title}</h2>
                        <p className="text-xs text-slate-500 text-center mt-1 max-w-[200px]">{subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-center gap-3 mb-5">
                            {pin.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className="w-12 h-14 text-center text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
                                <AlertCircle size={14} className="text-red-500 shrink-0" />
                                <p className="text-xs text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <button type="submit" disabled={loading || pin.join('').length !== 4}
                            className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all active:scale-95">
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : 'Confirm'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
