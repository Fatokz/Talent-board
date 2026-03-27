import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, RefreshCw, LogOut, ArrowRight, ShieldCheck } from 'lucide-react'
import { sendEmailVerification } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../../assets/crowdpayplain.png'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
    const navigate = useNavigate()
    const { currentUser, signOut } = useAuth()
    const [resending, setResending] = useState(false)
    const [checking, setChecking] = useState(false)

    // If they somehow get here but are already verified, send them home
    useEffect(() => {
        if (currentUser?.emailVerified) {
            navigate('/dashboard')
        }
    }, [currentUser, navigate])

    const handleResend = async () => {
        if (!currentUser) return
        setResending(true)
        try {
            await sendEmailVerification(currentUser)
            toast.success('Verification email sent! Check your inbox.')
        } catch (err) {
            toast.error('Failed to send email. Please try again in a moment.')
        } finally {
            setResending(false)
        }
    }

    const handleRefresh = async () => {
        if (!currentUser) return
        setChecking(true)
        try {
            await currentUser.reload()
            if (currentUser.emailVerified) {
                toast.success('Email verified! Redirecting...')
                navigate('/dashboard')
            } else {
                toast.error('Still not verified. Please click the link in your email.')
            }
        } catch (err) {
            toast.error('Reload failed. Please try signing out and back in.')
        } finally {
            setChecking(false)
        }
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/signin')
    }

    if (!currentUser) {
        return null // Will be handled by ProtectedRoute or just nothingness
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img src={Logo} alt="CrowdPay" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">Crowd<span className="text-emerald-500">Pay</span></span>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-10 text-center relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-blue-900/5">
                            <Mail size={36} className="text-blue-900" />
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Verify your email</h1>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8">
                            We've sent a verification link to <span className="text-slate-900 font-bold">{currentUser.email}</span>. 
                            Please click the link in your email to confirm your account.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleRefresh}
                                disabled={checking}
                                className="w-full py-4 rounded-2xl bg-blue-900 text-white font-black text-[15px] shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {checking ? (
                                    <RefreshCw size={18} className="animate-spin" />
                                ) : (
                                    <>I've verified my email <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>

                            <button 
                                onClick={handleResend}
                                disabled={resending}
                                className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-[15px] hover:bg-slate-50 transition-colors disabled:opacity-60"
                            >
                                {resending ? 'Sending...' : "Didn't receive it? Resend"}
                            </button>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <button 
                                onClick={handleSignOut}
                                className="flex items-center gap-2 mx-auto text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <LogOut size={14} /> Sign out and use another email
                            </button>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <ShieldCheck size={12} /> Securely managed by Interswitch
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-slate-400 font-medium">
                    Check your spam folder if you can't find the email in your inbox.
                </p>
            </div>
        </div>
    )
}
