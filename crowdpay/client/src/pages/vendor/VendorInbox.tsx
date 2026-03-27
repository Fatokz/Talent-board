import { useState, useEffect } from 'react'
import { MessageSquare, Menu, User, ChevronRight, Inbox } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorConversations, subscribeToVendorProfile, Conversation, VendorProfile } from '../../lib/db'
import VendorChatModal from '../../components/VendorChatModal'

interface Props { onMenuClick?: () => void }

export default function VendorInbox({ onMenuClick }: Props) {
    const { currentUser } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
    const [loading, setLoading] = useState(true)
    const [vendorData, setVendorData] = useState<VendorProfile | null>(null)

    useEffect(() => {
        if (!currentUser?.uid) return
        return subscribeToVendorProfile(currentUser.uid, (data) => setVendorData(data))
    }, [currentUser?.uid])

    useEffect(() => {
        if (!currentUser?.uid) return
        const unsub = subscribeToVendorConversations(currentUser.uid, (data) => {
            setConversations(data)
            setLoading(false)
        })
        return unsub
    }, [currentUser?.uid])

    const totalUnread = conversations.reduce((acc: number, c: Conversation) => acc + (c.vendorUnread || 0), 0)

    const formatTime = (ts: number) => {
        if (!ts) return ''
        const d = new Date(ts)
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        return isToday
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] font-sans overflow-hidden">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-100 px-4 sm:px-8 h-[72px] flex items-center justify-between sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="lg:hidden w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors">
                        <Menu size={18} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            Messages
                            {totalUnread > 0 && (
                                <span className="text-[11px] font-black bg-blue-600 text-white rounded-full px-2.5 py-0.5 shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                                    {totalUnread}
                                </span>
                            )}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] -mt-0.5">Inbox</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* ── Conversation List (Sidebar) ── */}
                <div className={`w-full lg:w-[400px] flex flex-col border-r border-slate-100 bg-white transition-all duration-300 ${activeConvo ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {loading ? (
                            <div className="space-y-3 p-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-[84px] bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                    <Inbox size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-base font-black text-slate-900 mb-1 uppercase tracking-tight">Empty Inbox</h3>
                                <p className="text-xs text-slate-500 font-medium max-w-[200px] leading-relaxed">
                                    Buyer inquiries and support requests will appear here.
                                </p>
                            </div>
                        ) : (
                            conversations.map((convo: Conversation) => {
                                const isActive = activeConvo?.id === convo.id
                                return (
                                    <button
                                        key={convo.id}
                                        onClick={() => setActiveConvo(convo)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                                            isActive 
                                                ? 'bg-blue-50 border-blue-100 shadow-sm' 
                                                : 'bg-white border-transparent hover:bg-slate-50/80 hover:border-slate-100'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                                            isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            <User size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className={`text-sm font-black truncate ${isActive ? 'text-blue-950' : 'text-slate-900'}`}>{convo.userName}</p>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tabular-nums">
                                                    {formatTime(convo.lastMessageAt)}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate font-medium ${convo.vendorUnread > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                                {convo.lastMessage || 'No messages yet'}
                                            </p>
                                        </div>
                                        {convo.vendorUnread > 0 && (
                                            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                            </div>
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* ── Active Conversation (Main Pane) ── */}
                <div className={`flex-1 bg-white flex flex-col transition-all duration-300 ${!activeConvo ? 'hidden lg:flex' : 'flex'}`}>
                    {activeConvo ? (
                        <div className="h-full flex flex-col relative">
                            {/* Mobile Back Button Overlay (only visible on mobile when convo is open) */}
                            <button 
                                onClick={() => setActiveConvo(null)}
                                className="lg:hidden absolute top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                            >
                                <ChevronRight size={20} className="rotate-180" />
                            </button>
                            
                            <VendorChatModal
                                isOpen={true}
                                onClose={() => setActiveConvo(null)}
                                vendorId={currentUser?.uid || activeConvo.vendorId} 
                                vendorName={vendorData?.name || activeConvo.vendorName}
                                buyerId={activeConvo.userId}
                                buyerName={activeConvo.userName}
                                isVendorView={true}
                                embedded={true}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#f8fafc]/50">
                            <div className="w-24 h-24 rounded-full bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 border border-slate-100">
                                <MessageSquare size={40} className="text-blue-100" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Select a conversation</h2>
                            <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed">
                                Choose a buyer from the list on the left to view messages and respond to inquiries.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
