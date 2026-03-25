import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, ArrowRight, Zap, CheckCircle, Users, TrendingUp } from 'lucide-react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { createVendorProfile } from '../../lib/db'
import { friendlyAuthError } from '../../lib/authErrors'
import Logo from '../../assets/crowdpayplain.png'
import toast from 'react-hot-toast'

export default function SignUpPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const redirectPath = searchParams.get('redirect')
    const { signInWithGoogle } = useAuth()
    const [form, setForm] = useState({ 
        name: '', email: '', password: '', confirmPw: '',
        businessName: '', businessCategory: '' 
    })
    const [role, setRole] = useState<'user' | 'vendor'>('user')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Always start at the top when arriving on this page
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

    const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (form.password !== form.confirmPw) {
            toast.error("Passwords don't match")
            return;
        }

        setLoading(true)
        setError('')
        try {
            // 1. Create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
            const user = userCredential.user;

            // 2. Set up their initial database profile
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                fullName: form.name,
                email: form.email,
                trustScore: 500,
                walletBalance: 0,
                kycStatus: 'unverified',
                roles: [role],
                currentRole: role,
                createdAt: serverTimestamp()
            });

            // 3. If Vendor, create their merchant profile
            if (role === 'vendor') {
                await createVendorProfile(user.uid, {
                    name: form.businessName,
                    category: form.businessCategory,
                    description: `Verified merchant profile for ${form.businessName}`,
                    bankName: '',
                    accountNumber: '',
                    accountName: ''
                });
            }

            // 4. Navigate home
            toast.success('Account created successfully!')
            navigate(redirectPath || '/dashboard')
        } catch (err: any) {
            const msg = friendlyAuthError(err, 'Failed to create account. Please try again.')
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
            // Wait for auth context to log them in via popup
            await signInWithGoogle()

            // When they arrive here, auth.currentUser is set
            // Check if they already exist in database? (For hackathon speed, we'll assume the 
            // merge happens flawlessly by setting it with merge: true if you want, or just redirecting)
            toast.success('Signed in with Google!')
            navigate(redirectPath || '/dashboard')
        } catch (err: any) {
            const msg = friendlyAuthError(err, 'Google sign-in failed. Please try again.')
            setError(msg)
            toast.error(msg)
            setLoading(false)
        }
    }

    const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3
    const strengthMeta = [null, { label: 'Weak', cls: 'bg-red-500', w: 'w-1/3' }, { label: 'Good', cls: 'bg-amber-400', w: 'w-2/3' }, { label: 'Strong', cls: 'bg-emerald-500', w: 'w-full' }]
    const sm = strengthMeta[pwStrength]

    return (
        <div className="min-h-screen flex font-sans animate-fade-in-up">
            {/* Left brand panel - SAME AS MOCKUP */}
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

                <div className="relative my-auto">
                    <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white/70 text-xs font-bold px-4 py-2 rounded-full mb-7">
                        <Zap size={12} className="text-emerald-400" /> Join 68,000+ members
                    </div>
                    <h1 className="text-4xl font-black text-white leading-snug tracking-tight mb-4">
                        Start your first Jar<br />in <span className="text-emerald-400">under 2 minutes.</span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-xs">
                        Build a savings group your friends and family will actually trust.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-9">
                        {[
                            { icon: TrendingUp, label: '₦485M+', sub: 'Total pooled' },
                            { icon: Users, label: '12,400+', sub: 'Active groups' },
                            { icon: CheckCircle, label: '9,200+', sub: 'Goals reached' },
                            { icon: Lock, label: '100%', sub: 'Consensus enforced' },
                        ].map(s => (
                            <div key={s.label} className="bg-white/6 border border-white/10 rounded-2xl p-4">
                                <s.icon size={16} className="text-emerald-400 mb-2" />
                                <p className="text-white font-black text-lg tracking-tight">{s.label}</p>
                                <p className="text-slate-500 text-xs">{s.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-xs text-slate-600 mt-auto">© 2026 CrowdPay · Enyata × Interswitch Buildathon</p>
            </div>

            {/* Right: form */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 sm:px-8 py-8 sm:py-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src={Logo} alt="CrowdPay Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-2xl font-black text-slate-900 tracking-tight">Crowd<span className="text-emerald-500">Pay</span></span>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-9">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create account</h2>
                            <p className="text-slate-500">Choose how you'll use CrowdPay</p>
                        </div>

                        {/* Role Selector */}
                        <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                            <button 
                                type="button"
                                onClick={() => setRole('user')}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${role === 'user' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                PERSONAL ACCOUNT
                            </button>
                            <button 
                                type="button"
                                onClick={() => setRole('vendor')}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${role === 'vendor' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                MERCHANT/VENDOR
                            </button>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Full name</label>
                                <input type="text" value={form.name} onChange={update('name')} placeholder="Adebayo Okafor" required className="auth-input" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Email address</label>
                                <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required className="auth-input" />
                            </div>

                            {role === 'vendor' && (
                                <>
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-bold text-slate-700 mb-2">Business Name</label>
                                        <input type="text" value={form.businessName} onChange={update('businessName')} placeholder="Your Store Name" required className="auth-input" />
                                    </div>
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-bold text-slate-700 mb-2">Category</label>
                                        <input type="text" value={form.businessCategory} onChange={update('businessCategory')} placeholder="e.g. Electronics, Fashion" required className="auth-input" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Password</label>
                                <div className="relative">
                                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Min. 8 characters" required className="auth-input pr-12" />
                                    <button type="button" onClick={() => setShowPw(s => !s)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {form.password && sm && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${sm.cls} ${sm.w} rounded-full transition-all`} />
                                        </div>
                                        <span className={`text-[11px] font-bold ${pwStrength === 1 ? 'text-red-500' : pwStrength === 2 ? 'text-amber-500' : 'text-emerald-500'}`}>{sm.label}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Confirm password</label>
                                <input type="password" value={form.confirmPw} onChange={update('confirmPw')} placeholder="Repeat password" required className={`auth-input ${form.confirmPw && form.confirmPw !== form.password ? 'border-red-400 bg-red-50' : ''}`} />
                                {form.confirmPw && form.confirmPw !== form.password && <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords don't match</p>}
                            </div>

                            <button type="submit" disabled={loading || (!!form.confirmPw && form.password !== form.confirmPw)}
                                className="mt-2 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black text-[15px] shadow-lg shadow-blue-900/25 hover:shadow-xl transition-all disabled:opacity-60">
                                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</> : <>Create account <ArrowRight size={16} /></>}
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
                                Already have an account?{' '}
                                <button onClick={() => navigate(redirectPath ? `/signin?redirect=${redirectPath}` : '/signin')} className="font-bold text-blue-900 hover:underline">Sign in</button>
                            </p>
                        </div>

                        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Lock size={12} /> No credit card required · Powered by Interswitch
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
