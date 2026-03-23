import { useState, useEffect } from 'react'
import {
    Users, Plus, Search, Settings, Crown, Clock,
    TrendingUp, Lock, Menu, MoreHorizontal,
} from 'lucide-react'
import Logo from '../assets/crowdpayplain.png'
import { jarTemplates, groupMembers } from '../data/mockData'
import { JarTemplate, GroupMember } from '../types'
import InviteMemberModal from '../components/InviteMemberModal'
import AjoRotationPanel from '../components/AjoRotationPanel'
import FundJarModal from '../components/FundJarModal'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserJars, Jar } from '../lib/db'

function fmtMoney(n: number) { return `₦${n.toLocaleString()}` }

const catMeta: Record<string, { grad: string; tag: string; hex: string; text: string }> = {
    Traditional: { grad: 'from-blue-900 to-blue-700', tag: 'bg-blue-100 text-blue-800', hex: '#1e3a8a', text: 'text-blue-900' },
    Celebration: { grad: 'from-emerald-700 to-emerald-500', tag: 'bg-emerald-100 text-emerald-800', hex: '#10b981', text: 'text-emerald-700' },
    Community: { grad: 'from-indigo-700 to-indigo-500', tag: 'bg-indigo-100 text-indigo-700', hex: '#6366f1', text: 'text-indigo-700' },
    Education: { grad: 'from-amber-600 to-amber-400', tag: 'bg-amber-100 text-amber-800', hex: '#f59e0b', text: 'text-amber-600' },
    Investment: { grad: 'from-pink-700 to-pink-500', tag: 'bg-pink-100 text-pink-800', hex: '#ec4899', text: 'text-pink-700' },
}

const statusMeta = {
    approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    declined: { label: 'Declined', cls: 'bg-red-50 text-red-700 border-red-200' },
}

function MemberRow({ m }: { m: GroupMember }) {
    const s = statusMeta[m.status]
    return (
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${m.status === 'approved' ? 'bg-gradient-to-br from-emerald-600 to-emerald-500' : m.status === 'declined' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                {m.initials}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                    {m.role === 'Creator' && <Crown size={13} className="text-amber-500" />}
                </div>
                <p className="text-xs text-slate-400">{m.role}</p>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${s.cls}`}>{s.label}</span>
            <button className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <MoreHorizontal size={14} className="text-slate-400" />
            </button>
        </div>
    )
}

function GroupCard({ jar, selected, onClick }: { jar: JarTemplate; selected: boolean; onClick: () => void }) {
    const pct = Math.min(Math.round((jar.raised / jar.goal) * 100), 100)
    const m = catMeta[jar.category] || catMeta.Traditional

    return (
        <div onClick={onClick} className={`rounded-2xl p-4 cursor-pointer transition-all overflow-hidden relative border ${selected ? `border-blue-900/40 bg-blue-50/50 shadow-md` : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            {selected && <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.grad}`} />}
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.grad} flex items-center justify-center shrink-0 shadow-md`}>
                    <span className="text-white font-black text-base">{jar.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{jar.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.tag}`}>{jar.category}</span>
                </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full bg-gradient-to-r ${m.grad} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
                <span>{fmtMoney(jar.raised)}</span>
                <span className="flex items-center gap-1"><Users size={9} /> {jar.members}</span>
            </div>
        </div>
    )
}

interface Props { onMenuClick?: () => void }

export default function GroupManagement({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [selectedId, setSelectedId] = useState<number | string>(jarTemplates[0].id)
    const [search, setSearch] = useState('')
    const [inviteModal, setInviteModal] = useState(false)
    const [fundModal, setFundModal] = useState(false)
    const [realJars, setRealJars] = useState<Jar[]>([])

    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = subscribeToUserJars(currentUser.uid, (jars) => {
            setRealJars(jars);
            if (jars.length > 0 && typeof selectedId === 'number') {
                setSelectedId(jars[0].id);
            }
        });
        return () => unsubscribe();
    }, [currentUser, selectedId]);

    const mappedJars: JarTemplate[] = realJars.map(jar => ({
        id: jar.id as any,
        name: jar.name,
        emoji: '💰',
        category: jar.category,
        goal: jar.goal,
        raised: jar.raised,
        members: jar.members.length,
        daysLeft: 30, // Mock for now
        governanceModel: 'Unanimous Consensus',
        description: `A ${jar.frequency} ${jar.category} group.`,
        color: 'from-blue-600 to-blue-500',
        goalReached: jar.raised >= jar.goal && jar.goal > 0,
        creatorId: jar.createdBy
    }));

    const displayJars = mappedJars;

    const selected = displayJars.find(j => j.id === selectedId) || displayJars[0];
    const filtered = displayJars.filter(j => j.name.toLowerCase().includes(search.toLowerCase()))

    if (!selected || displayJars.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
                <div className="bg-white border-b border-slate-100 px-6 py-5 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <Menu size={17} className="text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Group Management</h1>
                                <p className="text-sm text-slate-400 mt-0.5">Manage jar members, roles, and permissions.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                        <Users size={24} className="text-slate-500" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">No Groups Yet</h2>
                    <p className="text-slate-500 max-w-sm">You haven't created or joined any jars. Head over to the Dashboard to create one!</p>
                </div>
            </div>
        )
    }

    const m = catMeta[selected.category] || catMeta.Traditional
    const pct = selected.goal > 0 ? Math.min(Math.round((selected.raised / selected.goal) * 100), 100) : 0

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-5 shadow-sm sticky top-0 z-20">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Menu size={17} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Group Management</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Manage jar members, roles, and permissions.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body — 2 column */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                {/* Left: jar list */}
                <div className="w-full md:w-72 shrink-0 bg-white border-r border-b md:border-b-0 border-slate-100 flex flex-col h-1/2 md:h-full overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jars…"
                                className="w-full pl-9 pr-3 h-9 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-900 transition-colors" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                        {filtered.map(j => <GroupCard key={j.id} jar={j} selected={j.id === selectedId} onClick={() => setSelectedId(j.id)} />)}
                    </div>
                </div>

                {/* Right: detail */}
                <div className="flex-1 overflow-y-auto">
                    {/* Jar hero */}
                    <div className="bg-white border-b border-slate-100 px-8 py-6">
                        <div className="flex items-start gap-5 flex-wrap mb-6">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.grad} flex items-center justify-center shadow-lg shrink-0`}>
                                <span className="text-white font-black text-2xl">{selected.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap mb-1.5">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{selected.name}</h2>
                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${m.tag}`}>{selected.category}</span>
                                    {selected.goalReached && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Goal Reached ✓</span>}
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">{selected.description}</p>
                            </div>
                            <div className="flex gap-2">
                                {currentUser?.uid === selected.creatorId && (
                                    <button
                                        onClick={() => setInviteModal(true)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20"
                                    >
                                        <Plus size={13} /> Invite Member
                                    </button>
                                )}
                                {!selected.goalReached && (
                                    <button
                                        onClick={() => setFundModal(true)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                                    >
                                        <Plus size={13} /> Fund Jar
                                    </button>
                                )}
                                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600">
                                    <Settings size={13} /> Settings
                                </button>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                            {[
                                { icon: TrendingUp, label: 'Raised', value: fmtMoney(selected.raised), grad: m.grad },
                                { icon: Users, label: 'Members', value: selected.members, grad: 'from-indigo-700 to-indigo-500' },
                                { icon: Clock, label: selected.daysLeft > 0 ? 'Days Left' : 'Status', value: selected.daysLeft > 0 ? `${selected.daysLeft}d` : 'Done', grad: 'from-amber-600 to-amber-400' },
                                { icon: Lock, label: 'Governance', value: 'Unanimous', grad: 'from-blue-900 to-blue-700' },
                            ].map(s => (
                                <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shrink-0`}>
                                        <s.icon size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-base">{s.value}</p>
                                        <p className="text-[10px] text-slate-400">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Progress */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500 font-medium">Funding Progress</span>
                                <span className="font-black text-slate-900">{fmtMoney(selected.raised)} / {fmtMoney(selected.goal)}</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${m.grad} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className={`text-xs font-bold mt-1.5 ${m.text}`}>{pct}% funded</p>
                        </div>
                    </div>

                    {/* Members */}
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-black text-slate-900">Members ({groupMembers.length})</h3>
                            <div className="flex gap-2">
                                {['All', 'Approved', 'Pending'].map(f => (
                                    <button key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 hover:border-blue-900 transition-colors">{f}</button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 grid grid-cols-3 gap-3">
                                {['Member', 'Status', ''].map(h => (
                                    <span key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</span>
                                ))}
                            </div>
                            {groupMembers.map(m => <MemberRow key={m.id} m={m} />)}
                        </div>

                        {/* Trust notice */}
                        <div className="flex items-start gap-3 mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                            <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                                <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-900 mb-1">Governance Model</p>
                                <p className="text-sm text-blue-700 leading-relaxed">This jar uses Unanimous Consensus — every member must approve any withdrawal request. Declined votes require a publicly visible reason to maintain group trust.</p>
                            </div>
                        </div>

                        {/* Ajo Rotation Panel — shown only for Traditional jars */}
                        {selected.category === 'Traditional' && (() => {
                            // Find the real jar to get rotation data
                            const realJar = realJars.find(j => j.id === String(selected.id));
                            if (!realJar) return null;
                            // Build member list from mock (will be real members once member mgmt is wired)
                            const memberList = groupMembers.map(m => ({
                                uid: m.id.toString(),
                                name: m.name,
                                initials: m.initials,
                            }));
                            return (
                                <AjoRotationPanel
                                    jar={realJar}
                                    members={memberList}
                                    isCreator={currentUser?.uid === realJar.createdBy}
                                    currentUserId={currentUser?.uid ?? ''}
                                    onRequestPayout={() => { /* TODO: open WithdrawalRequestModal */ }}
                                />
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Invite Member Modal */}
            {selected && (
                <InviteMemberModal
                    isOpen={inviteModal}
                    onClose={() => setInviteModal(false)}
                    jar={selected}
                />
            )}

            {/* Fund Jar Modal */}
            {selected && (
                <FundJarModal
                    isOpen={fundModal}
                    onClose={() => setFundModal(false)}
                    jar={selected}
                />
            )}
        </div>
    )
}
