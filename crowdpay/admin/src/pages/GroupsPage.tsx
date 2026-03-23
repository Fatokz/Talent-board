import { useJars } from '../hooks/useJars';

export function GroupsPage() {
    const { jars, loading, error } = useJars();

    if (loading) {
        return (
            <div className="animate-fade-in flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-fade-in text-red-600 bg-red-50 p-4 rounded-lg">
                Error loading jars: {error}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-navy-dark mb-6">Jars & Groups</h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto pb-4">
                    <table className="w-full text-left admin-table min-w-[800px]">
                        <thead>
                            <tr>
                                <th>Jar Name</th>
                                <th>Category</th>
                                <th>Members</th>
                                <th>Goal / Amount</th>
                                <th>Raised</th>
                                <th>Status</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jars.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-slate-500">
                                        No jars found.
                                    </td>
                                </tr>
                            ) : (
                                jars.map(jar => (
                                    <tr key={jar.id}>
                                        <td className="font-medium text-navy">{jar.name || 'Unnamed Jar'}</td>
                                        <td>
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                                {jar.category}
                                            </span>
                                        </td>
                                        <td>{jar.members?.length || 0}</td>
                                        <td>₦{(jar.goal || jar.contributionAmount || 0).toLocaleString()}</td>
                                        <td className="text-green-600 font-medium">₦{(jar.raised || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                jar.status === 'completed' 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'bg-green-100 text-green-700'
                                            }`}>
                                                {jar.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="text-slate-500 text-sm">
                                            {jar.createdAt ? new Date(jar.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
