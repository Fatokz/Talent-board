import { useUsers } from '../hooks/useUsers';
import { useJars } from '../hooks/useJars';

export function UsersPage() {
    const { users, loading: usersLoading, error: usersError } = useUsers();
    const { jars } = useJars();

    const getUserJarsCount = (userId: string) => {
        return jars.filter(jar => jar.members?.includes(userId)).length;
    };

    if (usersLoading) {
        return (
            <div className="animate-fade-in flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
        );
    }

    if (usersError) {
        return (
            <div className="animate-fade-in text-red-600 bg-red-50 p-4 rounded-lg">
                Error loading users: {usersError}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-navy-dark mb-6">User Management</h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto pb-4">
                    <table className="w-full text-left admin-table min-w-[800px]">
                        <thead>
                            <tr>
                                <th>User Name</th>
                                <th>Email</th>
                                <th>Jars</th>
                                <th>Status</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id || user.uid}>
                                        <td className="font-medium text-navy">{user.fullName || 'Unnamed User'}</td>
                                        <td>{user.email || 'No email provided'}</td>
                                        <td>{getUserJarsCount(user.id || user.uid || '')} Active</td>
                                        <td><span className="status-active">Verified</span></td>
                                        <td className="text-slate-500 text-sm">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
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
