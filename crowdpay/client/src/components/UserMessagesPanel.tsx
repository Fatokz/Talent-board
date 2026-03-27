import { useState, useEffect } from 'react'
import { X, MessageSquare, Store, Inbox, ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserConversations, Conversation } from '../lib/db'
import VendorChatModal from './VendorChatModal'

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserMessagesPanel({ isOpen, onClose }: Props) {
    const { currentUser } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (!isOpen) { 
            // Reset state when closing panel
            setTimeout(() => setActiveConvo(null), 500)
        }
    }, [isOpen])

    useEffect(() => {
        if (!currentUser?.uid) return
        const unsub = subscribeToUserConversations(currentUser.uid, setConversations)
        return unsub
    }, [currentUser?.uid])

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[45] bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed top-0 bottom-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-500 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* ── Header ── */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 shadow-lg shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {isMobile && activeConvo ? (
                                <button 
                                    onClick={() => setActiveConvo(null)}
                                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                                    <MessageSquare size={18} />
                                </div>
                            )}
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-tight leading-none mb-1">
                                    {isMobile && activeConvo ? activeConvo.vendorName : 'Messages'}
                                </h2>
                                <p className="text-[10px] font-bold text-blue-200/80 uppercase tracking-widest leading-none">
                                    {isMobile && activeConvo ? 'Vendor Chat' : 'Your conversations'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    {isMobile && activeConvo ? (
                        <div className="absolute inset-0 z-10 bg-white animate-in slide-in-from-right duration-300 ease-out">
                            <VendorChatModal
                                isOpen={true}
                                onClose={() => setActiveConvo(null)}
                                vendorId={activeConvo.vendorId}
                                vendorName={activeConvo.vendorName}
                                buyerId={currentUser?.uid || ''}
                                buyerName={currentUser?.displayName || 'User'}
                                embedded={true}
                                hideHeader={isMobile}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
                            {conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                                        <Inbox size={32} className="text-blue-200" />
                                    </div>
                                    <p className="text-sm font-black text-slate-900 mb-1 uppercase tracking-tight">Empty Inbox</p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Message your favorite vendors to get personalized service and custom offers.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 space-y-2">
                                    {conversations.map((convo) => {
                                        const lastTs = convo.lastMessageAt ? new Date(convo.lastMessageAt) : null
                                        const timeStr = lastTs ? lastTs.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

                                        return (
                                            <button
                                                key={convo.id}
                                                onClick={() => setActiveConvo(convo)}
                                                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all text-left group relative overflow-hidden"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-100 flex items-center justify-center text-blue-900 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                    <Store size={22} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <p className="text-sm font-black text-slate-900 truncate">{convo.vendorName}</p>
                                                        {timeStr && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tabular-nums">
                                                                {timeStr}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs truncate font-medium ${convo.userUnread > 0 ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                                                        {convo.lastMessage || 'No messages yet'}
                                                    </p>
                                                </div>
                                                {convo.userUnread > 0 && (
                                                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Modal fall-through (only if not mobile or if explicitly triggered outside panel) */}
            {!isMobile && activeConvo && (
                <VendorChatModal
                    isOpen={!!activeConvo}
                    onClose={() => setActiveConvo(null)}
                    vendorId={activeConvo.vendorId}
                    vendorName={activeConvo.vendorName}
                    buyerId={currentUser?.uid || ''}
                    buyerName={currentUser?.displayName || 'User'}
                />
            )}
        </>
    )
}
