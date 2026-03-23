import { useState, useEffect } from 'react';
import { Shield, Settings, Save, AlertCircle, Plus, X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export function SettingsPage() {
    const { settings, loading, error, saving, updateSettings } = useSettings();
    
    // Local form state for platform constraints
    const [maxJars, setMaxJars] = useState(5);
    const [feePct, setFeePct] = useState(1.5);
    const [minGoal, setMinGoal] = useState(5000);

    // Local form state for admins
    const [admins, setAdmins] = useState<string[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');

    // Sync local state when settings load
    useEffect(() => {
        if (!loading && settings) {
            setMaxJars(settings.maxJarsPerUser);
            setFeePct(settings.transactionFeePercentage);
            setMinGoal(settings.minGoalAmount);
            setAdmins(settings.adminEmails || []);
        }
    }, [loading, settings]);

    const handleSaveGlobal = async () => {
        await updateSettings({
            maxJarsPerUser: maxJars,
            transactionFeePercentage: feePct,
            minGoalAmount: minGoal,
        });
    };

    const handleAddAdmin = async () => {
        if (!newAdminEmail.includes('@') || admins.includes(newAdminEmail)) return;
        
        const newAdminsList = [...admins, newAdminEmail.toLowerCase()];
        setAdmins(newAdminsList);
        setNewAdminEmail('');
        
        await updateSettings({ adminEmails: newAdminsList });
    };

    const handleRemoveAdmin = async (emailToRemove: string) => {
        // Prevent removing the last admin
        if (admins.length <= 1) {
            alert("Cannot remove the last administrator.");
            return;
        }
        
        const newAdminsList = admins.filter(e => e !== emailToRemove);
        setAdmins(newAdminsList);
        
        await updateSettings({ adminEmails: newAdminsList });
    };

    if (loading) {
        return (
            <div className="animate-fade-in flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl">
            <h1 className="text-2xl font-bold text-navy-dark mb-6">Platform Settings</h1>
            
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                {/* Global Variables Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-navy-dark">Global Constraints</h2>
                            <p className="text-sm text-slate-500">Configure core application limits and fees.</p>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Max Active Jars Per User</label>
                                <input 
                                    type="number" 
                                    value={maxJars}
                                    onChange={(e) => setMaxJars(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy focus:border-navy outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Limits spam and resource usage.</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Fee (%)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={feePct}
                                    onChange={(e) => setFeePct(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy focus:border-navy outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Deducted during standard goal withdrawals.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Goal Amount (₦)</label>
                                <input 
                                    type="number" 
                                    value={minGoal}
                                    onChange={(e) => setMinGoal(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy focus:border-navy outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={handleSaveGlobal}
                                disabled={saving}
                                className="flex items-center gap-2 bg-navy hover:bg-navy-dark text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Admin Access Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-navy-dark">Admin Access Management</h2>
                            <p className="text-sm text-slate-500">Manage who has access to this dashboard.</p>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <input 
                                type="email" 
                                placeholder="New admin email address..."
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy focus:border-navy outline-none"
                            />
                            <button 
                                onClick={handleAddAdmin}
                                disabled={saving || !newAdminEmail.includes('@')}
                                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap sm:w-auto w-full"
                            >
                                <Plus size={16} />
                                Grant Access
                            </button>
                        </div>

                        <div className="space-y-3">
                            {admins.map((email) => (
                                <div key={email} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                    <div className="flex items-center gap-3 font-medium text-navy-dark">
                                        {email}
                                        {email === 'admin@crowdpay.com' && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase tracking-wider rounded-full">Primary</span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveAdmin(email)}
                                        disabled={saving || admins.length <= 1}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1 disabled:opacity-30"
                                        title="Revoke access"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
