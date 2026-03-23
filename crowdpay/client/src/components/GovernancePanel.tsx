import { Trophy, ArrowRight, Zap } from 'lucide-react'
import { JarTemplate } from '../types'

interface GovernancePanelProps {
    jar: JarTemplate
    onRequestWithdraw: (jar: JarTemplate) => void
}

const formatNaira = (amount: number) => '₦' + amount.toLocaleString('en-NG')

export default function GovernancePanel({ jar, onRequestWithdraw }: GovernancePanelProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl animate-fade-in-up delay-400">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1c4fc7] to-[#0f6e5c]" />
            {/* Radial orb overlay — defined as CSS class to avoid inline style */}
            <div className="absolute inset-0 opacity-20 governance-orb-overlay" />

            {/* Floating orb decoration */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-green-500/10 blur-2xl" />

            <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Goal Reached</span>
                    </div>
                    <h3 className="text-white font-bold text-lg leading-tight">
                        {jar.goalReachedFor ?? jar.name}!
                    </h3>
                    <p className="text-white/60 text-sm mt-0.5">
                        {formatNaira(jar.goal)} collected · {jar.members} contributors · Awaiting unanimous sign-off
                    </p>
                </div>

                {/* CTA */}
                <button
                    onClick={() => onRequestWithdraw(jar)}
                    className="flex items-center gap-2 bg-white text-blue-900 font-bold text-sm py-3 px-5 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                >
                    Request Withdrawal
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
