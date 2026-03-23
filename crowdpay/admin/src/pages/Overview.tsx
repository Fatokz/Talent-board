import { Users, FolderKanban, Activity, AlertTriangle } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'

export function Overview() {
    const { totalUsers, activeJars, pendingRequests, loading, error } = useDashboardStats()

    const stats = [
        { label: 'Total Users', value: loading ? '...' : totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Active Jars', value: loading ? '...' : activeJars.toLocaleString(), icon: FolderKanban, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Pending Requests', value: loading ? '...' : pendingRequests.toLocaleString(), icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'System Health', value: '99.9%', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
    ]

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-navy-dark">Overview</h1>
                <p className="text-slate-500">Welcome back, here's what's happening today.</p>
            </div>
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                    Error loading statistics: {error}
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="admin-metric-card p-6 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-navy-dark">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-navy-dark">Recent Platform Activity</h2>
                </div>
                <div className="p-6 text-center text-slate-500 py-12">
                    Activity feed will appear here...
                </div>
            </div>
        </div>
    )
}
