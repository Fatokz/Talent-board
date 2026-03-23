
interface ProgressRingProps {
    percentage: number
    size?: number
    strokeWidth?: number
    color?: string
    trackColor?: string
}

export default function ProgressRing({
    percentage,
    size = 72,
    strokeWidth = 6,
    color = '#10B981',
    trackColor = '#E2E8F0',
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const clampedPct = Math.min(100, Math.max(0, percentage))
    const dashOffset = circumference - (clampedPct / 100) * circumference

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="progress-ring-circle"
                    style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
                />
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span
                    className="font-bold text-xs leading-none"
                    style={{ color: clampedPct >= 100 ? color : '#1E293B', fontSize: size < 60 ? '10px' : '12px' }}
                >
                    {clampedPct}%
                </span>
            </div>
        </div>
    )
}
