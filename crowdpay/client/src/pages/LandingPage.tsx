import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Shield, ChevronRight, Users, Lock, Zap, ArrowRight,
    Star, Globe, TrendingUp, Menu, X, CheckCircle,
    RefreshCcw, Gift, HeartHandshake, GraduationCap, Building2,
    Sparkles, ArrowUpRight, Coins, MessageSquare, ShoppingBag,
    Activity, Server, BadgeCheck, Flame,
    Landmark, Clock, BarChart3, Send, Fingerprint, Webhook,
} from 'lucide-react'
import Logo from '../assets/crowdpayplain.png'

/* ── Smooth navigation (fade-out then navigate)  */
function useSmoothNav() {
    const navigate = useNavigate()
    const [exiting, setExiting] = useState(false)

    const go = (path: string) => {
        setExiting(true)
        setTimeout(() => {
            window.scrollTo(0, 0)
            navigate(path)
        }, 220)
    }
    return { go, exiting }
}

/* ── Scroll reveal helper  */
function useScrollReveal(threshold = 0.1) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const el = ref.current; if (!el) return
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
            { threshold }
        )
        obs.observe(el); return () => obs.disconnect()
    }, [threshold])
    return { ref, visible }
}

function Reveal({ children, delay = 0, dir = 'up', className = '' }: {
    children: React.ReactNode; delay?: number
    dir?: 'up' | 'left' | 'right'; className?: string
}) {
    const { ref, visible } = useScrollReveal()
    const transforms: Record<string, string> = {
        up: 'translate-y-10', left: '-translate-x-10', right: 'translate-x-10'
    }
    return (
        <div ref={ref}
            className={`transition-all duration-700 ${className} ${visible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${transforms[dir]}`}`}
            style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    )
}

/* ── Live ticker item ──── */
function TickerItem({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: string; color: string
}) {
    return (
        <div className="flex items-center gap-3 px-6 py-3 border-r border-slate-200 last:border-r-0 shrink-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={14} className="text-white" />
            </div>
            <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mb-0.5">{label}</p>
                <p className="text-sm font-black text-slate-800">{value}</p>
            </div>
        </div>
    )
}

/* ── Data ── */
const jarCards = [
    {
        icon: RefreshCcw, title: 'Ajo (Rotating)', tag: 'Rotating Logic',
        desc: 'Automated rotating savings where every member gets a payout turn — transparent, zero disputes.',
        accent: 'bg-[#1e3a8a]', tagBg: 'bg-blue-50 text-[#1e3a8a]', border: 'border-blue-100',
        iconBg: 'bg-blue-50', iconColor: 'text-[#1e3a8a]',
    },
    {
        icon: Gift, title: 'Birthday Pool', tag: 'Pooling',
        desc: 'Quick pooling for celebrations. Everyone chips in; funds release only on unanimous group approval.',
        accent: 'bg-[#10b981]', tagBg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100',
        iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700',
    },
    {
        icon: HeartHandshake, title: 'Burial Support', tag: 'Support',
        desc: 'Large-scale community support. Raise and manage funds with dignity, speed, and full accountability.',
        accent: 'bg-indigo-600', tagBg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-100',
        iconBg: 'bg-indigo-50', iconColor: 'text-indigo-700',
    },
    {
        icon: GraduationCap, title: 'School Fees', tag: 'Direct Payout',
        desc: 'Transparent education fund. Funds go directly to the institution — every kobo tracked, every vote recorded.',
        accent: 'bg-amber-500', tagBg: 'bg-amber-50 text-amber-700', border: 'border-amber-100',
        iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
    },
    {
        icon: Building2, title: 'Family Project', tag: 'Investment',
        desc: 'Collective household or property investment. Build your legacy together, release funds together.',
        accent: 'bg-pink-600', tagBg: 'bg-pink-50 text-pink-700', border: 'border-pink-100',
        iconBg: 'bg-pink-50', iconColor: 'text-pink-700',
    },
]

const vendors = [
    { name: 'ShopRite Supermarket', category: 'Groceries & FMCG', initials: 'SR', color: 'bg-red-600' },
    { name: 'Jumia Technologies', category: 'E-commerce Platform', initials: 'JT', color: 'bg-orange-500' },
    { name: 'NNPC Fuel Station', category: 'Energy & Utilities', initials: 'NN', color: 'bg-green-700' },
    { name: 'Lagos Building Supply', category: 'Construction Materials', initials: 'LB', color: 'bg-[#1e3a8a]' },
]

const trustMetrics = [
    { icon: Activity, label: 'Firebase Sync', value: '< 100ms', color: 'bg-orange-500' },
    { icon: Server, label: 'Vercel Functions', value: '99.99% SLA', color: 'bg-[#1e3a8a]' },
    { icon: Landmark, label: 'Merchant Vault', value: 'Active', color: 'bg-[#10b981]' },
    { icon: Fingerprint, label: 'Consent Logs', value: 'Immutable', color: 'bg-purple-600' },
    { icon: Webhook, label: 'Payout Webhook', value: '< 30s', color: 'bg-sky-600' },
    { icon: Shield, label: 'Encryption', value: 'AES-256', color: 'bg-slate-700' },
    { icon: Clock, label: 'Uptime', value: '99.97%', color: 'bg-emerald-700' },
    { icon: BarChart3, label: 'Txn Volume', value: '₦485M+', color: 'bg-amber-600' },
]

export default function LandingPage() {
    const { go: navigate, exiting } = useSmoothNav()
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [activeChat, setActiveChat] = useState(0)
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'vendor'; text: string }[]>([
        { from: 'vendor', text: 'Hi! I\'m ShopRite. Your group order of ₦120,000 is confirmed. Funds will be received directly from CrowdPay escrow.' },
    ])

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 24)
        window.addEventListener('scroll', fn)
        return () => window.removeEventListener('scroll', fn)
    }, [])

    const sendChat = () => {
        if (!chatInput.trim()) return
        setChatMessages(prev => [...prev,
            { from: 'user', text: chatInput },
            { from: 'vendor', text: 'Great! I\'ll prepare your order. Once your group votes and approves, payment settles instantly.' }
        ])
        setChatInput('')
    }

    return (
        <div className={`min-h-screen bg-[#f8fafc] overflow-x-hidden font-sans transition-opacity duration-200 ${exiting ? 'opacity-0' : 'opacity-100'}`}>

            {/* ── NAVBAR ── */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-sm border-b border-slate-200/70' : 'bg-transparent'}`}>
                <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 flex items-center justify-center">
                            <img src={Logo} alt="CrowdPay Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            <span className="text-slate-900">Crowd</span><span style={{ color: '#10b981' }}>Pay</span>
                        </span>
                    </div>

                    <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
                        <a href="#how" className="hover:text-[#1e3a8a] transition-colors">How It Works</a>
                        <a href="#jars" className="hover:text-[#1e3a8a] transition-colors">Jar Types</a>
                        <a href="#marketplace" className="hover:text-[#1e3a8a] transition-colors">Marketplace</a>
                        <a href="#trust" className="hover:text-[#1e3a8a] transition-colors">Trust</a>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <button onClick={() => navigate('/signin')}
                            className="text-sm font-bold text-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                            Log in
                        </button>
                        <button onClick={() => navigate('/signup')}
                            className="btn-navy text-sm font-bold text-white px-5 py-2.5 rounded-xl">
                            Start a Jar
                        </button>
                    </div>

                    <button onClick={() => setMenuOpen(o => !o)}
                        className="md:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        {menuOpen ? <X size={18} className="text-slate-600" /> : <Menu size={18} className="text-slate-600" />}
                    </button>
                </div>

                {menuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 pb-5">
                        {[['How it works', '#how'], ['Jar Types', '#jars'], ['Marketplace', '#marketplace'], ['Trust', '#trust']].map(([l, h]) => (
                            <a key={l} href={h} onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-semibold text-slate-600">{l}</a>
                        ))}
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => navigate('/signin')} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700">Log in</button>
                            <button onClick={() => navigate('/signup')} className="flex-1 py-3 rounded-xl btn-green text-white text-sm font-bold">Start a Jar</button>
                        </div>
                    </div>
                )}
            </nav>

            {/* ── HERO SECTION ─── */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-[#f8fafc]">
                {/* Hero dots background */}
                <div className="hero-dots" />

                {/* Blobs */}
                <div className="hero-blob hero-blob-1" />
                <div className="hero-blob hero-blob-2" />
                <div className="hero-blob hero-blob-3" />

                <div className="relative max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        {/* Eyebrow badge */}
                        {/* <div className="inline-flex items-center gap-2 bg-[#1e3a8a]/[0.07] border border-[#1e3a8a]/20 text-[#1e3a8a] text-xs font-bold px-4 py-2 rounded-full mb-8 animate-fade-in-up">
                            <Shield size={12} />
                            Powered by Interswitch · Firebase-Gated · 100% Unanimous Approval Required
                        </div> */}

                        {/* Headline */}
                        <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black tracking-tight leading-[1.05] mb-6 animate-fade-in-up delay-100">
                            <span className="text-slate-900">Modernizing</span>{' '}
                            <br className="hidden sm:block" />
                            <span className="hero-gradient-text">Communal Trust</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
                            CrowdPay is a social fintech platform where group contributions are held in a secure{' '}
                            <strong className="text-[#1e3a8a]">CrowdPay Merchant Vault</strong> and released only{' '}
                            when <strong className="text-[#10b981]">every single member unanimously approves</strong> the payout.
                            No single custodian. Just transparent, community-powered finance.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center mb-14 animate-fade-in-up delay-300">
                            <button onClick={() => navigate('/signup')}
                                className="btn-green flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-base">
                                Start a Jar <ChevronRight size={16} />
                            </button>
                            <button onClick={() => navigate('/signin')}
                                className="flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 font-bold text-base hover:border-[#1e3a8a]/30 transition-colors">
                                <ShoppingBag size={16} className="text-[#1e3a8a]" />
                                Explore Marketplace
                            </button>
                        </div>

                        {/* Social proof strip */}
                        <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-in-up delay-400">
                            <div className="flex">
                                {['CO', 'TA', 'NB', 'AO', 'EK'].map((init, i) => (
                                    <div key={i}
                                        className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-sm ${['bg-[#1e3a8a]', 'bg-[#10b981]', 'bg-indigo-600', 'bg-amber-500', 'bg-pink-600'][i]} ${i ? '-ml-2.5' : ''}`}>
                                        {init}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm text-slate-500"><strong className="text-slate-800">68,000+</strong> members trust CrowdPay</span>
                            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}</div>
                        </div>
                    </div>

                    {/* Hero dashboard mockup */}
                    <div className="max-w-xl mx-auto relative">
                        {/* Floating badge */}
                        <div className="floating-badge-1 absolute -top-5 -left-6 z-10 bg-white border border-[#1e3a8a]/20 rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#1e3a8a] flex items-center justify-center">
                                <Lock size={14} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold leading-none">Protocol</p>
                                <p className="text-xs font-black text-[#1e3a8a] leading-tight">100% Unanimous<br />Group Consent Required</p>
                            </div>
                        </div>

                        {/* Second floating badge */}
                        <div className="floating-badge-2 absolute -bottom-4 -right-4 z-10 bg-white border border-emerald-200 rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#10b981] flex items-center justify-center">
                                <CheckCircle size={14} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold leading-none">The Vault</p>
                                <p className="text-xs font-black text-[#10b981] leading-tight">Merchant Balance<br />₦500,000 Held</p>
                            </div>
                        </div>

                        {/* Dashboard card */}
                        <div className="hero-card-shadow glass rounded-3xl border border-white/80 p-8 bg-white/90">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-[#1e3a8a]/[0.08] flex items-center justify-center">
                                    <RefreshCcw size={22} className="text-[#1e3a8a]" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-slate-900 text-[15px]">Adebayo Family Ajo</p>
                                    <p className="text-xs text-slate-400">12 members · Rotating Thrift</p>
                                </div>
                                <div className="flex items-center gap-1.5 status-approved text-xs font-bold px-3 py-1.5 rounded-full border border-[#10b981]/20">
                                    <CheckCircle size={11} /> Goal Reached
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400 font-medium">Pooled Amount</span>
                                    <span className="font-black text-slate-900">₦500,000 / ₦500,000</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full" />
                                </div>
                            </div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-left">Withdrawal Votes</p>
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { n: 'Chidinma Okafor', i: 'CO', approved: true },
                                    { n: 'Tunde Adeyemi', i: 'TA', approved: true },
                                    { n: 'Ngozi Bello', i: 'NB', approved: false },
                                ].map(v => (
                                    <div key={v.n} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black ${v.approved ? 'bg-[#10b981]' : 'bg-amber-400'}`}>{v.i}</div>
                                        <span className="flex-1 text-[13px] text-slate-600 font-medium text-left">{v.n}</span>
                                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 ${v.approved ? 'status-approved border border-[#10b981]/20' : 'status-pending border border-amber-200'}`}>
                                            {v.approved ? (
                                                <><CheckCircle size={10} /> Approved</>
                                            ) : (
                                                <><Clock size={10} /> Pending</>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                                <Lock size={12} className="text-slate-400" />
                                <span className="text-xs text-slate-400">Merchant Vault · Releases via Payout API on unanimous approval</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS / UNANIMOUS TRUST PROTOCOL ─── */}
            <section id="how" className="py-28 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#10b981]/5 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#1e3a8a]/5 blur-[80px] pointer-events-none" />

                <div className="max-w-6xl mx-auto px-6">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.12em] uppercase text-[#10b981] mb-4 px-4 py-1.5 bg-[#10b981]/[0.08] rounded-full border border-[#10b981]/20 block w-fit mx-auto">
                                <Zap size={11} /> The Unanimous Trust Protocol
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-5 leading-tight">
                                The Vault · The Gatekeeper ·<br />
                                <span className="hero-gradient-text">The Handshake</span>
                            </h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                                Contributions pool into your <strong className="text-[#1e3a8a]">CrowdPay Merchant Balance</strong> via Interswitch WebPay.
                                Our <strong className="text-[#10b981]">Firebase logic</strong> gates the payout until 100% group consensus is recorded —
                                then the <strong className="text-slate-700">Interswitch Disbursement API</strong> fires. One declined vote freezes everything, publicly.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-7 mb-20">
                        {[
                            {
                                n: '01', icon: Coins, title: 'The Vault — Merchant Balance',
                                desc: 'Members pay via Interswitch WebPay. Every naira lands in the CrowdPay Merchant Balance — held securely, untouched until the group decides.',
                                border: 'border-t-[#1e3a8a]', iconBg: 'bg-[#1e3a8a]/[0.07]', iconColor: 'text-[#1e3a8a]',
                            },
                            {
                                n: '02', icon: Lock, title: 'The Gatekeeper — Firebase Logic',
                                desc: 'Firebase Firestore tracks every vote in real-time. Our serverless logic will not call the Payout API until 100% approval is recorded in the database.',
                                border: 'border-t-[#10b981]', iconBg: 'bg-[#10b981]/[0.07]', iconColor: 'text-[#10b981]',
                            },
                            {
                                n: '03', icon: Users, title: 'The Handshake — Payout API',
                                desc: 'On unanimous consent, our Vercel serverless function triggers the Interswitch Disbursement API — funds move to the member or vendor in seconds.',
                                border: 'border-t-indigo-600', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-700',
                            },
                        ].map((s, i) => (
                            <Reveal key={s.n} delay={i * 120}>
                                <div className={`jar-card relative rounded-3xl p-10 border border-slate-200 border-t-4 ${s.border} bg-white`}>
                                    <span className="inline-block text-[10px] font-black text-white px-3 py-1 rounded-lg mb-6 bg-[#1e3a8a]">{s.n}</span>
                                    <div className={`w-14 h-14 rounded-2xl ${s.iconBg} flex items-center justify-center mb-5`}>
                                        <s.icon size={26} className={s.iconColor} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-3">{s.title}</h3>
                                    <p className="text-[15px] text-slate-500 leading-relaxed">{s.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {/* Cold payout visual explainer */}
                    <Reveal>
                        <div className="bg-gradient-to-br from-[#f8fafc] to-slate-50 rounded-3xl border border-slate-200 p-10 grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <span className="text-[10px] font-black tracking-widest uppercase text-[#1e3a8a] block mb-3">How The Architecture Works</span>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">Vault → Gatekeeper → Handshake</h3>
                                <p className="text-slate-500 leading-relaxed mb-7">
                                    CrowdPay doesn't rely on third-party escrow. Instead, funds sit in our regulated
                                    <strong className="text-[#1e3a8a]"> Interswitch Merchant Balance</strong>. Our Firebase
                                    logic is the gatekeeper — no payout API call is ever made until 100% consensus is confirmed.
                                </p>
                                <div className="flex flex-col gap-4">
                                    {[
                                        { icon: Shield, text: 'No single person can trigger a payout — only unanimous Firebase consent does', color: 'text-[#1e3a8a]', bg: 'bg-[#1e3a8a]/[0.07]' },
                                        { icon: Globe, text: 'Every vote & contribution is immutably logged in Firestore', color: 'text-[#10b981]', bg: 'bg-[#10b981]/[0.07]' },
                                        { icon: Flame, text: 'A declined vote blocks the Payout API — reason posted publicly', color: 'text-orange-600', bg: 'bg-orange-50' },
                                    ].map(f => (
                                        <div key={f.text} className="flex gap-3 items-start">
                                            <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                                                <f.icon size={16} className={f.color} />
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed mt-1.5">{f.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Vote tracker visual */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <p className="text-sm font-black text-slate-900">Payout Vote — Family Ajo</p>
                                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">Live</span>
                                </div>
                                <div className="space-y-3 mb-5">
                                    {[
                                        { name: 'Chidinma O.', approved: true },
                                        { name: 'Tunde A.', approved: true },
                                        { name: 'Emeka K.', approved: true },
                                        { name: 'Ngozi B.', approved: false },
                                        { name: 'Fatima I.', approved: false },
                                    ].map((v) => (
                                        <div key={v.name} className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${v.approved ? 'bg-[#10b981]' : 'bg-amber-400'}`} />
                                            <span className="flex-1 text-sm text-slate-600">{v.name}</span>
                                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${v.approved ? 'status-approved' : 'status-pending'}`}>
                                                {v.approved ? '✓ Approved' : '⏳ Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-500 font-semibold">Consensus</span>
                                    <span className="font-black text-[#1e3a8a]">3 / 5</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                    <div className="h-full w-[60%] bg-gradient-to-r from-[#1e3a8a] to-[#10b981] rounded-full" />
                                </div>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                    <Lock size={10} /> Awaiting 2 more approvals · Payout API locked by Firebase Gatekeeper
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── SOCIAL CARD BENTO GRID ── */}
            <section id="jars" className="py-28 bg-[#f8fafc]">
                <div className="max-w-6xl mx-auto px-6">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.12em] uppercase text-[#10b981] mb-4 px-4 py-1.5 bg-[#10b981]/[0.08] rounded-full border border-[#10b981]/20 block w-fit mx-auto">
                                <Sparkles size={11} /> The Social Card Grid
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-5">
                                Five templates.<br /><span className="hero-gradient-text">Every communal occasion.</span>
                            </h2>
                            <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                                From rotating Ajo savings to burial community support — CrowdPay has a purpose-built template with the right payout logic baked in.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {jarCards.map((c, i) => (
                            <Reveal key={c.title} delay={i * 80}>
                                <div className={`jar-card bg-white rounded-3xl border ${c.border} shadow-sm overflow-hidden cursor-pointer group h-full`}>
                                    <div className={`h-1 ${c.accent}`} />
                                    <div className="p-7 flex flex-col h-full">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`w-14 h-14 rounded-[18px] ${c.iconBg} flex items-center justify-center shrink-0`}>
                                                <c.icon size={26} className={c.iconColor} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-[17px] tracking-tight">{c.title}</h3>
                                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${c.tagBg}`}>{c.tag}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1">{c.desc}</p>
                                        <span className={`flex items-center gap-1.5 text-sm font-bold ${c.iconColor} group-hover:gap-2.5 transition-all`}>
                                            Start a {c.title.split(' ')[0]} Jar <ArrowUpRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </Reveal>
                        ))}

                        {/* Custom Jar Tile */}
                        <Reveal delay={jarCards.length * 80}>
                            <div onClick={() => navigate('/signup')}
                                className="jar-card rounded-3xl border-2 border-dashed border-slate-300 p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[220px] cursor-pointer hover:border-[#1e3a8a] hover:bg-[#1e3a8a]/[0.03] transition-all h-full">
                                <div className="w-14 h-14 rounded-[18px] bg-slate-100 flex items-center justify-center">
                                    <Sparkles size={26} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-700 text-base mb-1">Custom Jar</p>
                                    <p className="text-xs text-slate-400">Build any goal your group needs</p>
                                </div>
                                <span className="flex items-center gap-1.5 text-sm font-bold text-[#1e3a8a]">Create one <ArrowRight size={13} /></span>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ── STATS BAND ── */}
            <section className="py-18 bg-gradient-to-r from-[#1e3a8a] to-[#2d52b8]">
                <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {[
                        { display: '₦485M+', label: 'Total Pooled' },
                        { display: '12,400+', label: 'Active Groups' },
                        { display: '68,000+', label: 'Members' },
                        { display: '9,200+', label: 'Goals Reached' },
                    ].map(s => (
                        <Reveal key={s.label}>
                            <div className="text-center">
                                <p className="text-4xl md:text-5xl font-black text-white tracking-tight">{s.display}</p>
                                <p className="text-sm text-blue-300 mt-2 font-medium">{s.label}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ── MARKETPLACE ALPHA ────── */}
            <section id="marketplace" className="py-28 bg-white relative overflow-hidden">
                <div className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full bg-[#10b981]/5 blur-[100px] pointer-events-none" />

                <div className="max-w-6xl mx-auto px-6">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.12em] uppercase text-[#1e3a8a] mb-4 px-4 py-1.5 bg-[#1e3a8a]/[0.07] rounded-full border border-[#1e3a8a]/20 block w-fit mx-auto">
                                <ShoppingBag size={11} /> Marketplace Alpha · Vendor Integration
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-5 leading-tight">
                                Pay vendors directly.<br />
                                <span className="hero-gradient-text">No cash. No middleman.</span>
                            </h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                                Once your group votes to approve a purchase, CrowdPay settles directly from escrow to
                                the verified vendor's account via Interswitch Transfer — instantaneously.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-2 gap-10 items-start mb-16">
                        {/* Vendor listing */}
                        <Reveal dir="left">
                            <div>
                                <p className="text-sm font-black text-slate-900 mb-5 uppercase tracking-wider">Marketplace — Verified Vendors</p>
                                <div className="space-y-3">
                                    {vendors.map((v, i) => (
                                        <div key={v.name}
                                            className={`jar-card flex items-center gap-4 p-5 rounded-2xl border ${activeChat === i ? 'border-[#1e3a8a]/40 bg-[#1e3a8a]/[0.03] shadow-md' : 'border-slate-200 bg-white'} cursor-pointer transition-all`}
                                            onClick={() => setActiveChat(i)}>
                                            <div className={`w-12 h-12 rounded-2xl ${v.color} flex items-center justify-center text-white font-black text-sm`}>{v.initials}</div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 text-sm">{v.name}</p>
                                                <p className="text-xs text-slate-400">{v.category}</p>
                                            </div>
                                            {/* Vendor Verified badge */}
                                            <div className="flex items-center gap-1.5 status-approved text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#10b981]/20">
                                                <BadgeCheck size={11} />
                                                Vendor Verified
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-5 bg-[#f8fafc] rounded-2xl border border-slate-200">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-[#10b981]/[0.1] flex items-center justify-center">
                                            <TrendingUp size={14} className="text-[#10b981]" />
                                        </div>
                                        <p className="text-sm font-black text-slate-900">The Handshake — Direct Vendor Payout</p>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed text-center md:text-left">
                                        When 100% vote <CheckCircle size={14} className="inline-block text-[#10b981] ml-0.5 mb-0.5" /> is recorded in Firebase, our Vercel serverless function calls the{' '}
                                        <strong className="text-[#1e3a8a]">Interswitch Disbursement API</strong> and moves funds from our Merchant Balance
                                        to the vendor's Nigerian bank account in <strong className="text-[#10b981]">&lt; 30 seconds</strong>. Zero cash handling.
                                    </p>
                                </div>
                            </div>
                        </Reveal>

                        {/* In-app vendor chat mockup */}
                        <Reveal dir="right">
                            <div className="bg-[#f8fafc] rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                {/* Chat header */}
                                <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${vendors[activeChat].color} flex items-center justify-center text-white font-black text-xs`}>
                                        {vendors[activeChat].initials}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 text-sm">{vendors[activeChat].name}</p>
                                        <p className="text-[11px] text-[#10b981] font-semibold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" /> Vendor Verified · Online
                                        </p>
                                    </div>
                                    <MessageSquare size={16} className="text-slate-400" />
                                </div>

                                {/* Messages */}
                                <div className="p-5 space-y-3 min-h-[200px]">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] text-xs leading-relaxed px-4 py-3 rounded-2xl font-medium ${msg.from === 'user' ? 'bg-[#1e3a8a] text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input */}
                                <div className="bg-white border-t border-slate-200 p-4 flex items-center gap-3">
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendChat()}
                                        placeholder="Message vendor..."
                                        className="flex-1 text-xs text-slate-700 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#1e3a8a]/40"
                                    />
                                    <button onClick={sendChat}
                                        className="btn-navy w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                                        <Send size={14} className="text-white" />
                                    </button>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Feature tiles */}
                    <div className="grid sm:grid-cols-3 gap-5">
                        {[
                            { icon: BadgeCheck, title: 'Vendor KYC Verified', desc: 'All marketplace vendors complete Interswitch KYB/KYC verification before listing.', color: 'bg-[#10b981]/[0.08]', iconColor: 'text-[#10b981]' },
                            { icon: Zap, title: 'Interswitch Payout API', desc: 'Post-vote, our Vercel function triggers the Interswitch Disbursement API — funds reach the vendor bank in under 30 seconds.', color: 'bg-[#1e3a8a]/[0.07]', iconColor: 'text-[#1e3a8a]' },
                            { icon: MessageSquare, title: 'In-App Vendor Chat', desc: 'Negotiate, confirm orders, and coordinate delivery without leaving the CrowdPay platform.', color: 'bg-amber-50', iconColor: 'text-amber-600' },
                        ].map(f => (
                            <Reveal key={f.title}>
                                <div className="jar-card bg-white rounded-2xl border border-slate-200 p-6">
                                    <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                                        <f.icon size={22} className={f.iconColor} />
                                    </div>
                                    <h3 className="font-black text-slate-900 text-[15px] mb-2">{f.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ─ */}
            <section className="py-24 bg-[#f8fafc]">
                <div className="max-w-6xl mx-auto px-6">
                    <Reveal>
                        <div className="text-center mb-14">
                            <span className="text-[11px] font-black tracking-[0.12em] uppercase text-[#1e3a8a] block mb-3">Real Stories</span>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">People who already trust CrowdPay</h2>
                        </div>
                    </Reveal>
                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            { name: 'Chidinma O.', role: 'Ajo Group Lead', text: 'Before CrowdPay, we argued every month about who held the money. Now the vault does it — no drama.', av: 'CO', bg: 'bg-[#1e3a8a]' },
                            { name: 'Tunde A.', role: 'Family Project Member', text: "We raised ₦2.4M for our father's land. Every kobo was visible. Everyone voted before it was released.", av: 'TA', bg: 'bg-[#10b981]' },
                            { name: 'Ngozi B.', role: 'School Fee Organiser', text: 'My siblings and I use CrowdPay to pay school fees every term. The transparency is what makes it work.', av: 'NB', bg: 'bg-indigo-700' },
                        ].map((t, i) => (
                            <Reveal key={t.name} delay={i * 100}>
                                <div className="jar-card bg-white rounded-3xl p-7 border border-slate-200 shadow-sm h-full">
                                    <div className="flex gap-0.5 mb-5">{[...Array(5)].map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}</div>
                                    <p className="text-[15px] text-slate-500 leading-relaxed mb-6">"{t.text}"</p>
                                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                                        <div className={`w-10 h-10 rounded-full ${t.bg} flex items-center justify-center text-white text-xs font-black`}>{t.av}</div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">{t.name}</p>
                                            <p className="text-xs text-slate-400">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-6">
                    <Reveal>
                        <div className="cta-banner-bg rounded-[36px] p-14 text-center relative overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
                            <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-white/[4%] pointer-events-none" />
                            <div className="relative">
                                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-7">
                                    <Zap size={12} className="fill-white" /> Start for free — no hidden fees
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Ready to save smarter together?</h2>
                                <p className="text-lg text-white/60 mb-10 leading-relaxed">Create your first Jar in under 2 minutes. Your group's money, governed by your group's vote.</p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <button onClick={() => navigate('/signup')}
                                        className="btn-green flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-[15px]">
                                        Start a Jar <ArrowRight size={16} />
                                    </button>
                                    <button onClick={() => navigate('/signin')}
                                        className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 bg-white/[8%] text-white font-semibold text-[15px] hover:bg-white/[12%] transition-colors">
                                        <ShoppingBag size={16} />
                                        Explore Marketplace
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── TRUST METRICS FOOTER ─── */}
            <footer id="trust" className="bg-white border-t border-slate-200">
                {/* Live ticker strip */}
                <div className="border-b border-slate-200 bg-[#f8fafc] overflow-hidden relative">
                    <div className="flex items-center">
                        <div className="shrink-0 bg-[#1e3a8a] px-5 py-3.5 z-10 flex items-center gap-2">
                            <Activity size={14} className="text-white animate-pulse" />
                            <span className="text-white text-[11px] font-black uppercase tracking-wider whitespace-nowrap">Live Status</span>
                        </div>
                        <div className="ticker-track flex">
                            {[...trustMetrics, ...trustMetrics].map((m, i) => (
                                <TickerItem key={i} icon={m.icon} label={m.label} value={m.value} color={m.color} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enterprise transparency section */}
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="text-[11px] font-black tracking-[0.12em] uppercase text-[#1e3a8a] block mb-3">Enterprise Transparency</span>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                                Infrastructure you can <span className="hero-gradient-text">trust unconditionally</span>
                            </h2>
                            <p className="text-slate-500 max-w-xl mx-auto">
                                Every millisecond of your group's financial data is secured, audited, and synchronized in real-time across our infrastructure.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
                        {[
                            { icon: Activity, title: '100ms Firebase Sync', desc: 'Firestore tracks every vote and contribution in real-time across all group members — the Gatekeeper never sleeps.', color: 'bg-orange-50', iconColor: 'text-orange-600', badge: '< 100ms' },
                            { icon: Server, title: 'Vercel Serverless', desc: 'Edge functions handle Interswitch webhooks and trigger disbursement calls with zero cold-start latency.', color: 'bg-[#1e3a8a]/[0.07]', iconColor: 'text-[#1e3a8a]', badge: '99.99% SLA' },
                            { icon: Landmark, title: 'Merchant Vault (Interswitch)', desc: 'Group contributions pool into our regulated Interswitch Merchant Balance — held securely until unanimous consent.', color: 'bg-[#10b981]/[0.08]', iconColor: 'text-[#10b981]', badge: 'Regulated' },
                            { icon: Shield, title: 'AES-256 Encryption', desc: 'Military-grade encryption at rest and in transit for all financial data and consent records.', color: 'bg-slate-100', iconColor: 'text-slate-600', badge: 'End-to-End' },
                        ].map((f, i) => (
                            <Reveal key={f.title} delay={i * 80}>
                                <div className="jar-card bg-white rounded-2xl border border-slate-200 p-6 h-full">
                                    <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                                        <f.icon size={22} className={f.iconColor} />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-black text-slate-900 text-sm">{f.title}</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{f.desc}</p>
                                    <span className="status-approved text-[10px] font-black px-2.5 py-1 rounded-full">{f.badge}</span>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {/* Footer links */}
                    <div className="grid md:grid-cols-4 gap-12 pt-12 border-t border-slate-200 mb-10">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-9 h-9 flex items-center justify-center">
                                    <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xl font-black text-slate-900">Crowd<span style={{ color: '#10b981' }}>Pay</span></span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-5">
                                Social fintech platform modernizing communal trust. Vault-gated by Interswitch · Consent-locked by Firebase · Paid out by the Disbursement API.
                            </p>
                            <div className="flex items-center gap-2 py-2 px-3 bg-[#f8fafc] border border-slate-200 rounded-xl w-fit">
                                <Shield size={13} className="text-[#10b981]" />
                                <span className="text-xs text-slate-500 font-semibold">Powered by Interswitch · Enyata × Buildathon 2026</span>
                            </div>
                        </div>
                        {[
                            { title: 'Product', links: [['How it works', '#how'], ['Jar Types', '#jars'], ['Marketplace', '#marketplace'], ['Trust Model', '#trust']] },
                            { title: 'Account', links: [['Sign Up', '/signup'], ['Log In', '/signin']] },
                        ].map(col => (
                            <div key={col.title}>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">{col.title}</p>
                                <div className="flex flex-col gap-3">
                                    {col.links.map(([l, h]) => (
                                        <button key={l}
                                            onClick={() => h.startsWith('/') ? navigate(h) : document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' })}
                                            className="text-sm text-slate-500 hover:text-[#1e3a8a] transition-colors text-left">
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-200 pt-7 flex flex-wrap justify-between gap-3">
                        <p className="text-xs text-slate-400">© 2026 CrowdPay. Built for Enyata × Interswitch Buildathon.</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block animate-pulse" /> All systems operational</span>
                            <span>Privacy Policy</span>
                            <span>Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
