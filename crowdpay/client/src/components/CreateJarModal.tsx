import { useState, useEffect } from 'react';
import { createJar } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { X, Shuffle, ListOrdered, Crown } from 'lucide-react';
import { mockVendors } from '../data/mockData';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (jarId: string) => void;
    initialName?: string;
    initialGoal?: number;
    initialVendorId?: string;
}

const ROTATION_METHODS = [
    {
        value: 'creator' as const,
        icon: Crown,
        label: 'Creator Sets Order',
        desc: 'You manually arrange who gets paid and when.',
        color: 'border-blue-500 bg-blue-50',
        iconColor: 'text-blue-700',
        activeIcon: 'bg-blue-700',
    },
    {
        value: 'random' as const,
        icon: Shuffle,
        label: 'Random Draw',
        desc: 'Fair lottery — order is randomly shuffled when all members join.',
        color: 'border-emerald-500 bg-emerald-50',
        iconColor: 'text-emerald-700',
        activeIcon: 'bg-emerald-700',
    },
    {
        value: 'join-order' as const,
        icon: ListOrdered,
        label: 'Join Order',
        desc: 'First member to join gets paid first.',
        color: 'border-indigo-500 bg-indigo-50',
        iconColor: 'text-indigo-700',
        activeIcon: 'bg-indigo-700',
    },
] as const;

export default function CreateJarModal({ 
    isOpen, onClose, onSuccess, 
    initialName, initialGoal, initialVendorId 
}: Props) {
    const { currentUser } = useAuth();
    const [name, setName] = useState(initialName ?? '');
    const [category, setCategory] = useState('Traditional');
    const [goal, setGoal] = useState(initialGoal?.toString() ?? '');
    const [frequency, setFrequency] = useState('Monthly');
    const [contributionAmount, setContributionAmount] = useState('');
    const [vendorId, setVendorId] = useState(initialVendorId ?? '');
    const [rotationMethod, setRotationMethod] = useState<'creator' | 'random' | 'join-order'>('creator');
    const [targetDays, setTargetDays] = useState('30');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialName ?? '');
            setGoal(initialGoal?.toString() ?? '');
            setVendorId(initialVendorId ?? '');
        }
    }, [isOpen, initialName, initialGoal, initialVendorId]);

    if (!isOpen) return null;

    const isTraditional = category === 'Traditional';
    const contributionLabel = isTraditional ? 'Contribution per cycle (₦)' : 'Minimum Contribution (₦)';
    const contributionPlaceholder = isTraditional ? 'e.g. 10000' : 'e.g. 5000 (optional)';

    const handleClose = () => {
        setName(''); setCategory('Traditional'); setGoal('');
        setFrequency('Monthly'); setContributionAmount('');
        setVendorId('');
        setRotationMethod('creator');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        try {
            setLoading(true);
            const numGoal = parseInt(goal.replace(/\D/g, ''), 10);
            const numContribution = contributionAmount
                ? parseInt(contributionAmount.replace(/\D/g, ''), 10)
                : undefined;

            const jarId = await createJar({
                name,
                category,
                goal: numGoal,
                frequency,
                contributionAmount: numContribution,
                ...(vendorId ? { vendorId } : {}),
                ...(isTraditional && { rotationMethod, currentRound: 0, disbursedRounds: 0 }),
                createdBy: currentUser.uid,
                targetDays: parseInt(targetDays, 10) || 30,
            }, currentUser.uid);

            setLoading(false);
            onSuccess(jarId);
            handleClose();
        } catch (error) {
            console.error('Failed to create jar:', error);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Create New Jar</h2>
                        <p className="text-sm text-slate-500">Setup a new contribution pool.</p>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <X size={16} className="text-slate-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-4 mb-8">
                        {/* Jar Name */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Jar Name</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Vacation Fund"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Category + Frequency */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 transition-all font-medium text-slate-900"
                                >
                                    <option>Traditional</option>
                                    <option>Celebration</option>
                                    <option>Community</option>
                                    <option>Education</option>
                                    <option>Investment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Frequency</label>
                                <select
                                    value={frequency}
                                    onChange={e => setFrequency(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 transition-all font-medium text-slate-900"
                                >
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                    <option>One-time</option>
                                </select>
                            </div>
                        </div>

                        {/* Vendor Linkage (Marketplace) */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                Link to a Verified Vendor <span className="text-[11px] font-bold text-emerald-500 bg-emerald-100 px-1.5 py-0.5 rounded-md ml-1">New!</span>
                            </label>
                            <select
                                value={vendorId}
                                onChange={e => setVendorId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium text-emerald-900"
                            >
                                <option value="">No vendor (Standard Personal Jar)</option>
                                {mockVendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-emerald-600 mt-1.5 leading-relaxed font-medium">
                                Optional: Link this jar to a CrowdPay vendor. Payouts go directly to their merchant account.
                            </p>
                        </div>

                        {/* Ajo Payout Order Method */}
                        {isTraditional && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Payout Rotation Order
                                </label>
                                <p className="text-xs text-slate-400 mb-3">How will you decide who gets the pot first?</p>
                                <div className="flex flex-col gap-2.5">
                                    {ROTATION_METHODS.map(m => {
                                        const active = rotationMethod === m.value;
                                        return (
                                            <button
                                                key={m.value}
                                                type="button"
                                                onClick={() => setRotationMethod(m.value)}
                                                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${active ? m.color : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? m.activeIcon : 'bg-slate-100'}`}>
                                                    <m.icon size={17} className={active ? 'text-white' : 'text-slate-400'} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${active ? m.iconColor : 'text-slate-700'}`}>{m.label}</p>
                                                    <p className="text-[11px] text-slate-400 leading-snug">{m.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Contribution Amount */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                {contributionLabel}
                                {!isTraditional && <span className="ml-1.5 text-[11px] font-semibold text-slate-400">(optional)</span>}
                            </label>
                            <input
                                required={isTraditional}
                                type="number"
                                min="1"
                                value={contributionAmount}
                                onChange={e => setContributionAmount(e.target.value)}
                                placeholder={contributionPlaceholder}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            />
                            <p className="text-[11px] text-slate-400 mt-1.5">
                                {isTraditional
                                    ? `Each member contributes this fixed amount every ${frequency.toLowerCase()} cycle.`
                                    : 'The minimum a member can contribute. Leave blank for no minimum.'}
                            </p>
                        </div>

                        {/* Target Goal */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Target Goal (₦)</label>
                                <input
                                    required
                                    type="number"
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    placeholder="e.g. 500000"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Duration (Days)</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={targetDays}
                                    onChange={e => setTargetDays(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-medium text-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={handleClose} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-bold shadow-md shadow-blue-900/20 disabled:opacity-50 transition-all">
                            {loading ? 'Creating...' : 'Create Jar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
