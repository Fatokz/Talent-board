import { useState, useEffect, useRef } from 'react'
import { X, Send, Store, MessageSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { sendMessage, subscribeToMessages, markConversationRead, subscribeToVendorProfile, subscribeToUserDoc, Message, VendorProfile, UserProfile } from '../lib/db'

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vendorId: string;
    vendorName: string;
    buyerId: string;
    buyerName: string;
    isVendorView?: boolean;
    embedded?: boolean;
    hideHeader?: boolean;
}

export default function VendorChatModal({ 
    isOpen, onClose,
    vendorId, vendorName, 
    buyerId, buyerName,
    isVendorView, embedded, hideHeader 
}: Props) {
    const { currentUser, userProfile } = useAuth()
    const [msgs, setMsgs] = useState<Message[]>([])
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
    const [buyerProfile, setBuyerProfile] = useState<UserProfile | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const resolvedConversationId = buyerId && vendorId ? `${buyerId}_${vendorId}` : ''

    // Source of Truth for names (prioritize real-time Firestore profiles over passed props)
    const resolvedVendorName = vendorProfile?.name || vendorName
    const resolvedBuyerName = buyerProfile?.fullName || (isVendorView ? buyerName : (userProfile?.fullName || buyerName))

    const myName = isVendorView ? resolvedVendorName : resolvedBuyerName
    const otherUserName = isVendorView ? resolvedBuyerName : resolvedVendorName

    useEffect(() => {
        if (!isOpen || !vendorId) return
        return subscribeToVendorProfile(vendorId, (data) => setVendorProfile(data))
    }, [isOpen, vendorId])

    useEffect(() => {
        if (!isOpen || !buyerId) return
        return subscribeToUserDoc(buyerId, (data) => setBuyerProfile(data))
    }, [isOpen, buyerId])

    useEffect(() => {
        if (!isOpen || !resolvedConversationId) return
        const unsub = subscribeToMessages(resolvedConversationId, (data) => {
            setMsgs(data.sort((a, b) => a.timestamp - b.timestamp))
        })
        // Mark as read when conversation opens
        markConversationRead(resolvedConversationId, isVendorView ? 'vendor' : 'user').catch(() => {})
        return unsub
    }, [isOpen, resolvedConversationId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [msgs])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim() || !currentUser || !resolvedConversationId) return

        const newMsg = text.trim()
        setText('')
        setLoading(true)

        try {
            await sendMessage(resolvedConversationId, {
                senderId: currentUser.uid,
                text: newMsg,
                timestamp: Date.now(),
                senderName: myName
            }, {
                vendorId: vendorId,
                vendorName: resolvedVendorName,
                userId: buyerId,
                userName: resolvedBuyerName,
                senderIsVendor: !!isVendorView,
            })
        } catch (err) {
            console.error('Send error:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    if (!isOpen && !embedded) return null

    const content = (
        <div className={`relative w-full h-full bg-white flex flex-col overflow-hidden ${embedded ? '' : 'rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-500 ease-out pointer-events-auto'}`}>
            {/* Header */}
            {!hideHeader && (
                <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 p-6 text-white shrink-0 relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner overflow-hidden">
                                {(() => {
                                    const logo = vendorProfile?.logo || (vendorProfile as any)?.logoUrl || (vendorProfile as any)?.image || (vendorProfile as any)?.profileImage;
                                    return logo ? (
                                        <img 
                                            src={logo} 
                                            alt="" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Store size={22} className="text-white/90" />
                                    )
                                })()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-black text-lg tracking-tight truncate leading-tight">{otherUserName}</h3>
                                <div className="flex items-center gap-1.5 opacity-90">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Online now</span>
                                </div>
                            </div>
                        </div>
                        {!embedded && (
                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f8fafc] custom-scrollbar">
                {msgs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-10">
                        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                            <MessageSquare size={36} className="text-blue-200" />
                        </div>
                        <p className="text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">Direct Messaging</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Ask about product availability, logistics, or custom order requirements.
                        </p>
                    </div>
                ) : (
                    msgs.map((m: Message, idx: number) => {
                        const isMe = m.senderId === currentUser?.uid
                        const isFirstInGroup = idx === 0 || msgs[idx - 1].senderId !== m.senderId
                        
                        return (
                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${!isFirstInGroup ? '-mt-3' : ''}`}>
                                {isFirstInGroup && (
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mx-2">
                                        {isMe ? 'You' : (m.senderName === 'User' ? otherUserName : m.senderName)}
                                    </span>
                                )}
                                <div className={`max-w-[85%] group relative animate-in zoom-in-95 fade-in duration-300`}>
                                    <div className={`p-4 rounded-[1.5rem] text-sm font-medium shadow-sm transition-all ${
                                        isMe 
                                            ? 'bg-blue-900 text-white rounded-tr-none shadow-blue-900/10' 
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-slate-200/50'
                                    }`}>
                                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-1 px-1 transition-opacity ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tabular-nums">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 md:pb-6">
                <form onSubmit={handleSend} className="relative flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-1.5 focus-within:bg-white focus-within:border-blue-500 transition-all shadow-inner">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message..."
                        disabled={loading}
                        className="flex-1 h-11 px-4 bg-transparent text-sm font-medium focus:outline-none disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || loading}
                        className="w-11 h-11 rounded-2xl bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 disabled:opacity-30 disabled:hover:scale-100 transition-all active:scale-95 shadow-lg shadow-blue-900/20 shrink-0"
                    >
                        <Send size={18} className="ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    )

    if (embedded) return content

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-end md:p-6 pointer-events-none">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative w-full max-w-lg h-[90vh] md:h-[650px] pointer-events-auto">
                {content}
            </div>
        </div>
    )
}
