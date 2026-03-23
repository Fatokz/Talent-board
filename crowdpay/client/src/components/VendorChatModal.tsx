import { useState, useEffect, useRef } from 'react'
import { X, Send, Store, ShieldCheck, RefreshCcw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { sendMessage, subscribeToMessages, Message } from '../lib/db'

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vendorId: string;
    vendorName: string;
}

export default function VendorChatModal({ isOpen, onClose, vendorId, vendorName }: Props) {
    const { currentUser } = useAuth()
    const [msgs, setMsgs] = useState<Message[]>([])
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const conversationId = currentUser ? `${currentUser.uid}_${vendorId}` : ''

    useEffect(() => {
        if (!isOpen || !conversationId) return
        const unsub = subscribeToMessages(conversationId, (data) => {
            setMsgs(data.sort((a, b) => a.timestamp - b.timestamp))
        })
        return unsub
    }, [isOpen, conversationId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [msgs])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim() || !currentUser || !conversationId) return

        const newMsg = text.trim()
        setText('')
        setLoading(true)

        try {
            await sendMessage(conversationId, {
                senderId: currentUser.uid,
                text: newMsg,
                timestamp: Date.now(),
                senderName: currentUser.displayName || 'User'
            })
            
            // Mock Vendor Response after 1.5s
            setTimeout(async () => {
                await sendMessage(conversationId, {
                    senderId: vendorId,
                    text: `Hello! Thanks for reaching out to ${vendorName}. We've received your message and will get back to you shortly regarding this request.`,
                    timestamp: Date.now(),
                    senderName: vendorName
                })
            }, 1500)

        } catch (err) {
            console.error('Send error:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-end md:p-6 pointer-events-none">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
            
            <div className="relative w-full max-w-lg h-full md:h-[600px] bg-white md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                                <Store size={22} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight">{vendorName}</h3>
                                <div className="flex items-center gap-1.5 opacity-80 decoration-current">
                                    <ShieldCheck size={12} className="text-emerald-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Verified Merchant</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                    {msgs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-40">
                            <RefreshCcw size={40} className="mb-4 text-blue-500" />
                            <p className="text-sm font-bold text-slate-900">Start a conversation</p>
                            <p className="text-xs text-slate-500 mt-1">Ask the vendor about products, delivery, or custom jar setups.</p>
                        </div>
                    ) : (
                        msgs.map((m, idx) => {
                            const isMe = m.senderId === currentUser?.uid
                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                                        isMe 
                                            ? 'bg-blue-900 text-white rounded-tr-none' 
                                            : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                    }`}>
                                        <p className="leading-relaxed">{m.text}</p>
                                        <p className={`text-[9px] mt-1.5 opacity-50 font-bold uppercase tracking-wider ${isMe ? 'text-right' : ''}`}>
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type your message..."
                            disabled={loading}
                            className="w-full pl-5 pr-14 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                        />
                        <button
                            type="submit"
                            disabled={!text.trim() || loading}
                            className="absolute right-1.5 top-1.5 w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 disabled:opacity-30 disabled:hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                        >
                            <Send size={16} className="relative -right-0.5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
