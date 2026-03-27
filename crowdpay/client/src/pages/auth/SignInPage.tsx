import { useState, useEffect, ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Eye, EyeOff, ArrowRight, Zap, CheckCircle, Users, TrendingUp, Lock } from 'lucide-react'
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { friendlyAuthError } from '../../lib/authErrors'
import Logo from '../../assets/crowdpayplain.png'
import toast from 'react-hot-toast'

export default function SignInPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const redirectPath = searchParams.get('redirect')
    const isVerifiedSuccess = searchParams.get('verified') === 'true'
    const { signInWithGoogle } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState<ReactNode>('')

    // Always start at the top when arriving on this page
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

    // Show success message if redirected from VerifyEmailPage
    useEffect(() => {
        if (isVerifiedSuccess) {
            toast.success('Email verified successfully! Please sign in.', { 
                icon: '✅',
                duration: 5000,
                style: { borderRadius: '20px', background: '#020617', color: '#fff' }
            })
        }
    }, [isVerifiedSuccess])

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

            // Fetch profile for role-aware redirection
            const userSnap = await getDoc(doc(db, 'users', result.user.uid))
            const profile = userSnap.data()
            const target = profile?.currentRole === 'vendor' ? '/dashboard/vendor' : '/dashboard'

            navigate(redirectPath || target)
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
            const msg = friendlyAuthError(err, 'Failed to sign in with Google.')
            setError(msg)
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex font-sans animate-fade-in-up">
            {/* Left brand panel - RESTORED CONSISTENCY */}
            <div className="hidden lg:flex flex-col w-[46%] bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 relative overflow-hidden p-12">
                <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                <div className="relative flex items-center gap-3 mb-auto cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-12 h-12 flex items-center justify-center">
                        <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-2xl font-black text-white tracking-tight">Crowd<span className="text-emerald-400">Pay</span></span>
                </div>

                <div className="relative my-auto">
                    <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white/70 text-xs font-bold px-4 py-2 rounded-full mb-7">
                        <Zap size={12} className="text-emerald-400 animate-pulse" /> Back to secure login
                    </div>
                    <h1 className="text-4xl font-black text-white leading-snug tracking-tight mb-4">
                        Access your Jars<br />and <span className="text-emerald-400">manage your wealth.</span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-xs">
                        Welcome back to the world's most trusted peer-to-peer savings platform.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-9">
                        {[
                            { icon: TrendingUp, label: '₦485M+', sub: 'Total pooled' },
                            { icon: Users, label: '12,400+', sub: 'Active groups' },
                            { icon: CheckCircle, label: '9,200+', sub: 'Goals reached' },
                            { icon: Lock, label: '100%', sub: 'Consensus enforced' },
                        ].map(s => (
                            <div key={s.label} className="bg-white/6 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-default group/stat">
                                <s.icon size={16} className="text-emerald-400 mb-2 group-hover/stat:scale-110 transition-transform" />
                                <p className="text-white font-black text-lg tracking-tight">{s.label}</p>
                                <p className="text-slate-500 text-xs">{s.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-xs text-slate-600 mt-auto font-medium tracking-tight">© 2026 CrowdPay · Enyata × Interswitch Buildathon</p>
            </div>

            {/* Right: form */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 sm:px-8 py-8 sm:py-12 relative overflow-hidden">
                {/* Mobile-only logo */}
                <div className="lg:hidden absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                    <div className="w-10 h-10">
                        <img src={Logo} alt="CrowdPay Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight italic">Crowd<span className="text-emerald-500">Pay</span></span>
                </div>

                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-9 relative overflow-hidden group/card transition-all">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome back</h2>
                            <p className="text-slate-500 font-medium mb-8">Securely sign in to your CrowdPay account.</p>

                            {error && (
                                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold flex items-start gap-3 animate-shake">
                                    <Shield size={16} className="shrink-0 mt-0.5" />
                                    <div>{error}</div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="auth-input"
                                        placeholder="name@company.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end ml-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                        <button type="button" className="text-[10px] font-black text-blue-900 uppercase tracking-widest hover:text-emerald-500 transition-colors">Forgot Password?</button>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type={showPw ? 'text' : 'password'} 
                                            required
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="auth-input pr-14"
                                            placeholder="••••••••"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPw(!showPw)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-900 transition-colors"
                                        >
                                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-2xl font-black text-[15px] shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Sign In <ArrowRight size={18} /></>
                                    )}
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-white px-4 text-slate-400 font-bold uppercase tracking-widest">Or continue with</span>
                                </div>
                            </div>

                            <button 
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[15px] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="text-sm font-bold text-slate-700">Continue with Google</span>
                            </button>
                            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-500">
                                Don't have an account? <button onClick={() => navigate('/signup')} className="font-bold text-blue-900 hover:underline">Sign up for free</button>
                            </p>
                        </div>

                        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Lock size={12} /> No credit card required · Powered by Interswitch
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
}
