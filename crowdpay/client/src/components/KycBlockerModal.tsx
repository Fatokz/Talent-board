import { AlertTriangle, ShieldCheck, ChevronRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function KycBlockerModal({ isOpen, onClose }: Props) {
    const navigate = useNavigate()

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-10"
                >
                    <X size={16} />
                </button>

                {/* Header Decoration */}
                <div className="h-32 bg-gradient-to-br from-amber-400 to-amber-600 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center rotate-3">
                        <ShieldCheck size={32} className="text-amber-500" />
                    </div>
                </div>

                <div className="pt-10 px-6 pb-6 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Profile Incomplete</h2>
                    </div>
                    
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                        For your security and regulatory compliance, you must complete identity verification (NIN) before you can create jars, fund wallets, or accept invitations.
                    </p>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2">Required Information</p>
                        <ul className="text-sm text-amber-700 space-y-2">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 11-Digit NIN
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Phone Number
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Residential Address
                            </li>
                        </ul>
                    </div>

                    <button 
                        onClick={() => {
                            onClose();
                            navigate('/dashboard/profile');
                        }}
                        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-black text-sm shadow-md shadow-blue-900/20 hover:shadow-lg transition-all"
                    >
                        Complete Profile Now <ChevronRight size={16} />
                    </button>
                    
                    <button 
                        onClick={onClose}
                        className="w-full mt-3 h-11 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    )
}
