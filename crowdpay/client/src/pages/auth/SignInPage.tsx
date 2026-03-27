import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Eye, EyeOff, Lock, ArrowRight, Zap, CheckCircle } from 'lucide-react'
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { friendlyAuthError } from '../../lib/authErrors'
import Logo from '../../assets/crowdpayplain.png'
import toast from 'react-hot-toast'

export default function SignInPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const redirectPath = searchParams.get('redirect')
    const { signInWithGoogle } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState<any>('')

    // Always start at the top when arriving on this page
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

    const handleResend = async (user: any) => {
        setResending(true)
        try {
            await sendEmailVerification(user)
            toast.success('Verification email resent!')
        } catch (err) {
            toast.error('Failed to resend email. Please try again later.')
        } finally {
            setResending(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const result = await signInWithEmailAndPassword(auth, email, password)
            if (!result.user.emailVerified) {
                setError(
                    <span>
                        Your email is not verified. 
                        <button 
                            type="button" 
                            onClick={() => handleResend(result.user)}
                            className="ml-2 font-black underline hover:text-blue-900 disabled:opacity-50"
                            disabled={resending}
                        >
                            {resending ? 'Resending...' : 'Resend Link'}
                        </button>
                    </span>
                )
                return
            }
            navigate(redirectPath || '/dashboard')
            toast.success('Welcome back!')
        } catch (err: any) {
            const msg = friendlyAuthError(err, 'Failed to sign in. Please check your credentials.')
            setError(msg)
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError('')
        try {
            await signInWithGoogle()
            toast.success('Signed in with Google!')
            navigate(redirectPath || '/dashboard')
        } catch (err: any) {
            const msg = friendlyAuthError(err, 'Google sign-in failed. Please try again.')
            setError(msg)
            toast.error(msg)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex font-sans animate-fade-in-up">
            {/* Left brand panel */}
            <div className="hidden lg:flex flex-col w-[46%] bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 relative overflow-hidden p-12">
                <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                <div className="relative flex items-center gap-3 mb-auto">
                    <div className="w-12 h-12 flex items-center justify-center">
                        <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-2xl font-black text-white tracking-tight">Crowd<span className="text-emerald-400">Pay</span></span>
                </div>

                {/* Main copy */}
                <div className="relative my-auto">
                    <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white/70 text-xs font-bold px-4 py-2 rounded-full mb-7">
                        <Zap size={12} className="text-emerald-400" /> Secure · Transparent · Unanimous
                    </div>
                    <h1 className="text-4xl font-black text-white leading-snug tracking-tight mb-4">
                        Your group's savings,<br /><span className="text-emerald-400">finally trustworthy.</span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-xs">
                        Decentralized social savings powered by unanimous consensus. No single custodian. Just community-governed money.
                    </p>
                    <div className="flex flex-col gap-3.5 mt-9">
                        {[
                            { icon: Lock, text: 'Funds locked in escrow until all members vote' },
                            { icon: Shield, text: '100% unanimous consensus required to release' },
                            { icon: CheckCircle, text: 'Full audit trail visible to every member' },
                        ].map(f => (
                            <div key={f.text} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                                    <f.icon size={15} className="text-emerald-400" />
                                </div>
                                <span className="text-sm text-slate-400">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="relative text-xs text-slate-600 mt-auto">© 2026 CrowdPay · Built for Enyata × Interswitch Buildathon</p>
            </div>

            {/* Right: form */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 sm:px-8 py-8 sm:py-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-2xl font-black text-slate-900 tracking-tight">Crowd<span className="text-emerald-500">Pay</span></span>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-9">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome back</h2>
                            <p className="text-slate-500">Sign in to your CrowdPay account</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Email address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                                    className="auth-input" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700">Password</label>
                                    <button type="button" className="text-xs font-semibold text-blue-900 hover:underline">Forgot password?</button>
                                </div>
                                <div className="relative">
                                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                                        className="auth-input pr-12" />
                                    <button type="button" onClick={() => setShowPw(s => !s)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="mt-2 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black text-[15px] shadow-lg shadow-blue-900/25 hover:shadow-xl transition-all disabled:opacity-70">
                                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
                            </button>
                        </form>

                        <div className="my-6 flex items-center gap-3">
                            <div className="flex-1 h-px bg-slate-200" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        <button type="button" onClick={handleGoogleSignIn} disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                <path d="M1 1h22v22H1z" fill="none" />
                            </svg>
                            <span className="text-sm font-bold text-slate-700">Continue with Google</span>
                        </button>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-500">
                                Don't have an account?{' '}
                                <button onClick={() => navigate(redirectPath ? `/signup?redirect=${redirectPath}` : '/signup')} className="font-bold text-blue-900 hover:underline">Create one</button>
                            </p>
                        </div>

                        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Lock size={12} /> End-to-end secured · Powered by Interswitch
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
