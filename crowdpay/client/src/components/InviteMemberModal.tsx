import { useState, useEffect, useRef } from 'react';
import { createInvitation, searchUsers, UserProfile } from '../lib/db';
import { sendInviteEmail } from '../lib/email';
import { useAuth } from '../contexts/AuthContext';
import { JarTemplate } from '../types';
import { X, Mail, CheckCircle, Search, User, Copy } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    jar: JarTemplate;
}

export default function InviteMemberModal({ isOpen, onClose, jar }: Props) {
    const { currentUser } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserProfile[]>([]);
    const [selected, setSelected] = useState<UserProfile | null>(null);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [success, setSuccess] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setQuery(''); setResults([]); setSelected(null);
            setSuccess(false); setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (selected) return; // already picked someone
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const hits = await searchUsers(query);
                // Don't show the current user in results
                setResults(hits.filter(u => u.uid !== currentUser?.uid && u.email !== currentUser?.email));
            } finally {
                setSearching(false);
            }
        }, 350);
    }, [query, selected]);

    if (!isOpen) return null;

    const handleSelect = (user: UserProfile) => {
        setSelected(user);
        setQuery(user.email);
        setResults([]);
    };

    const handleClear = () => {
        setSelected(null);
        setQuery('');
        setResults([]);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = selected?.email ?? query.trim();
        if (!currentUser || !email) return;

        try {
            setLoading(true);
            const inviteId = await createInvitation(
                jar.id.toString(), currentUser.uid, email,
                {
                    jarName: jar.name,
                    inviterName: currentUser.displayName || 'A member',
                    inviteeName: selected?.fullName,
                }
            );

            await sendInviteEmail({
                jar_name: jar.name,
                inviter_name: currentUser.displayName || 'A member',
                jar_goal: `₦${jar.goal.toLocaleString()}`,
                jar_frequency: 'Monthly',
                invite_link: `${window.location.origin}/invite/${inviteId}`,
                to_email: email,
            });

            setSuccess(true);
            setTimeout(() => { setSuccess(false); handleClear(); onClose(); }, 2500);
        } catch (err) {
            console.error('Failed to send invite:', err);
        } finally {
            setLoading(false);
        }
    };

    const displayEmail = selected?.email ?? query;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Invite Members</h2>
                        <p className="text-sm text-slate-500">Invite someone to {jar.name}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <X size={16} className="text-slate-600" />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Invitation Sent!</h3>
                        <p className="text-sm text-slate-500">
                            We've emailed the invitation. They'll appear in the members list once they accept.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6">

                        {/* Search field */}
                        <div className="mb-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                Search by name or email
                            </label>
                            <div className="relative">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={e => { setQuery(e.target.value); if (selected) setSelected(null); }}
                                    placeholder="Type a name or email address…"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                                {/* Spinner / clear */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {searching && <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />}
                                    {selected && !searching && (
                                        <button type="button" onClick={handleClear}
                                            className="text-slate-400 hover:text-slate-600 transition-colors">
                                            <X size={15} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dropdown results */}
                        {results.length > 0 && (
                            <div className="mb-2 border border-slate-200 rounded-2xl overflow-hidden shadow-lg bg-white">
                                {results.map((user, i) => (
                                    <button
                                        key={user.uid}
                                        type="button"
                                        onClick={() => handleSelect(user)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {user.fullName?.[0]?.toUpperCase() ?? <User size={14} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate">{user.fullName}</p>
                                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected user chip */}
                        {selected && (
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-4 mt-1">
                                <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                    {selected.fullName?.[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-blue-900 truncate">{selected.fullName}</p>
                                    <p className="text-[11px] text-blue-600 truncate">{selected.email}</p>
                                </div>
                                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                            </div>
                        )}

                        {/* Fallback hint for non-registered users */}
                        {query.includes('@') && !selected && results.length === 0 && !searching && (
                            <p className="text-xs text-slate-400 mt-1 mb-4 flex items-center gap-1.5">
                                <Mail size={11} />
                                Not a registered user — we'll send them an email invitation anyway.
                            </p>
                        )}

                        {/* Invite Link Option */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Or share link</p>
                                <p className="text-xs text-slate-500">Anyone with the link can request to join</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const text = `You've been invited to join "${jar.name}" on CrowdPay! Join here: ${window.location.origin}/invite/${jar.id}`;
                                    navigator.clipboard.writeText(text);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
                            >
                                {copied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (!selected && displayEmail.length < 5)}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-bold shadow-md shadow-blue-900/20 disabled:opacity-50 transition-all flex items-center gap-2">
                                {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                                {loading ? 'Sending…' : 'Send Invite'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
