import { useState } from 'react'
import { Users, Clock, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react'
import { JarTemplate } from '../types'
import ProgressRing from './ProgressRing'

interface JarCardProps {
    jar: JarTemplate
    delay?: number
    onWithdraw?: (jar: JarTemplate) => void
    onActivate?: (jar: JarTemplate) => void
}

const formatNaira = (amount: number) =>
    '₦' + amount.toLocaleString('en-NG')

/* Map category → Tailwind classes (replaces runtime hex strings) */
const catAccent: Record<string, {
    accentBar: string   // gradient for top accent bar
    iconBg: string      // icon container bg
    pillBg: string      // category pill bg
    pillText: string    // category pill text
    goalText: string    // goal amount text color
    progressBar: string // progress bar gradient
}> = {
    Traditional: {
        accentBar: 'from-blue-900 to-blue-700',
        iconBg: 'bg-blue-900/10',
        pillBg: 'bg-blue-900/10',
        pillText: 'text-blue-900',
        goalText: 'text-blue-900',
        progressBar: 'from-blue-900 to-blue-700',
    },
    Celebration: {
        accentBar: 'from-emerald-700 to-emerald-500',
        iconBg: 'bg-emerald-500/10',
        pillBg: 'bg-emerald-500/10',
        pillText: 'text-emerald-700',
        goalText: 'text-emerald-700',
        progressBar: 'from-emerald-700 to-emerald-500',
    },
    Community: {
        accentBar: 'from-indigo-700 to-indigo-500',
        iconBg: 'bg-indigo-500/10',
        pillBg: 'bg-indigo-500/10',
        pillText: 'text-indigo-700',
        goalText: 'text-indigo-700',
        progressBar: 'from-indigo-700 to-indigo-500',
    },
    Education: {
        accentBar: 'from-amber-600 to-amber-400',
        iconBg: 'bg-amber-500/10',
        pillBg: 'bg-amber-500/10',
        pillText: 'text-amber-700',
        goalText: 'text-amber-700',
        progressBar: 'from-amber-600 to-amber-400',
    },
    Investment: {
        accentBar: 'from-pink-700 to-pink-500',
        iconBg: 'bg-pink-500/10',
        pillBg: 'bg-pink-500/10',
        pillText: 'text-pink-700',
        goalText: 'text-pink-700',
        progressBar: 'from-pink-700 to-pink-500',
    },
}

const defaultCat = catAccent.Traditional

export default function JarCard({ jar, delay = 0, onWithdraw, onActivate }: JarCardProps) {
    const [hovered, setHovered] = useState(false)
    const percentage = jar.goal > 0 ? Math.round((jar.raised / jar.goal) * 100) : 0
    const cat = catAccent[jar.category] ?? defaultCat

    return (
        <div
            className="jar-card bg-white rounded-2xl p-5 border border-slate-100 cursor-pointer animate-fade-in-up relative overflow-hidden"
            style={{ animationDelay: `${delay}ms` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Subtle top accent */}
            <div
                className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${cat.accentBar} transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-60'}`}
            />

            {/* Goal reached badge */}
            {jar.goalReached && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Goal Reached!
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${cat.iconBg}`}>
                        {jar.emoji}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">{jar.name}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${cat.pillBg} ${cat.pillText}`}>
                            {jar.category}
                        </span>
                    </div>
                </div>

                <ProgressRing
                    percentage={percentage}
                    size={64}
                    strokeWidth={5}
                    color={jar.goalReached ? '#10B981' : undefined}
                />
            </div>

            {/* Description */}
            <p className="text-slate-500 text-xs mb-4 leading-relaxed line-clamp-2">{jar.description}</p>

            {/* Goal amount */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Raised</span>
                    <span className="text-slate-800 font-semibold">{formatNaira(jar.raised)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Goal</span>
                    <span className={`font-bold ${cat.goalText}`}>{formatNaira(jar.goal)}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${cat.progressBar}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {jar.members}
                    </span>
                    {jar.daysLeft > 0 && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {jar.daysLeft}d left
                        </span>
                    )}
                </div>

                {/* Governance badge */}
                <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>Unanimous Vote</span>
                </div>
            </div>

            {/* Withdraw CTA for goal-reached jars */}
            {jar.goalReached && (
                <button
                    onClick={() => onWithdraw?.(jar)}
                    className="btn-green mt-3 w-full flex items-center justify-center gap-2 text-white text-xs font-semibold py-2.5 px-4 rounded-xl"
                >
                    Request Withdrawal
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            )}

            {/* Activate CTA for templates */}
            {!jar.goalReached && typeof jar.id === 'number' && onActivate && (
                <button
                    onClick={() => onActivate?.(jar)}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-blue-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
                >
                    Use Template
                    <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                </button>
            )}
        </div>
    )
}
