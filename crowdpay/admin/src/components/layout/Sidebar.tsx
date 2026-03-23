import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, FolderKanban, Settings, LogOut, X } from 'lucide-react'
import logoUrl from '../../assets/crowdpayplain.png'
import { useAdminAuth } from '../../contexts/AuthContext'

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation()
    const { logout } = useAdminAuth()
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const navItems = [
        { name: 'Overview', path: '/', icon: LayoutDashboard },
        { name: 'Users', path: '/users', icon: Users },
        { name: 'Jars / Groups', path: '/groups', icon: FolderKanban },
        { name: 'Settings', path: '/settings', icon: Settings },
    ]

    return (
        <>
            <aside 
                className={`
                    fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 via-blue-950 to-blue-900 
                    text-white flex flex-col border-r border-white/10 transition-transform duration-300 ease-in-out
                    lg:translate-x-0 lg:static lg:inset-auto
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Glow orbs */}
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-20 -left-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                <div className="relative h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <img src={logoUrl} alt="CrowdPay" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            Crowd<span className="text-green-light">Pay</span>
                            <span className="ml-2 text-[10px] font-normal text-slate-300 uppercase tracking-widest leading-none block">Admin</span>
                        </h1>
                    </div>
                    {/* Mobile Close Button */}
                    <button 
                        onClick={onClose}
                        className="lg:hidden p-2 -mr-2 text-white/50 hover:text-white rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="relative flex-1 py-6 overflow-y-auto">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em] px-6 mb-3">Main Menu</p>
                    <div className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={onClose} // Close sidebar on mobile when navigating
                                    className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                                        isActive
                                            ? 'nav-active text-white bg-white/10'
                                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-green-light' : 'text-white/50'} />
                                    <span className={`flex-1 text-[14px] font-${isActive ? 'semibold' : 'medium'}`}>
                                        {item.name}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                <div className="relative p-4 border-t border-white/10">
                    <button 
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Custom Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut size={32} className="ml-1" />
                            </div>
                            <h3 className="text-xl font-bold text-navy-dark mb-2">Sign Out</h3>
                            <p className="text-slate-500 text-sm mb-8">
                                Are you sure you want to sign out of the CrowdPay Admin Dashboard?
                            </p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLogoutConfirm(false)
                                        logout()
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-600/20"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
