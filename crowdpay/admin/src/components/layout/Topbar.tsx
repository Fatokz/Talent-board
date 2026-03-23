import { useState, useRef, useEffect } from 'react'
import { Bell, Search, User as UserIcon, Menu, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'

interface TopbarProps {
    onOpenSidebar: () => void;
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
    const { user } = useAdminAuth()
    const { notifications, unreadCount, markAllAsRead } = useNotifications()
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleToggleDropdown = () => {
        if (!showDropdown && unreadCount > 0) {
            markAllAsRead()
        }
        setShowDropdown(!showDropdown)
    }

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-20">
            {/* Mobile Menu & Search */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onOpenSidebar}
                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
                >
                    <Menu size={24} />
                </button>
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users, jars, txt..."
                        className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-navy-light w-64 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                <button 
                    onClick={handleToggleDropdown}
                    className="relative p-2 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-full transition-colors"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                {/* Notifications Dropdown */}
                {showDropdown && (
                    <div className="absolute top-12 right-12 w-80 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden animate-fade-in origin-top-right">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-semibold text-navy-dark">Notifications</h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {notifications.length} Recent
                            </span>
                        </div>
                        
                        <div className="max-h-[320px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 text-sm">
                                    No new notifications
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map((notif) => (
                                        <Link 
                                            key={notif.id}
                                            to={notif.link}
                                            onClick={() => setShowDropdown(false)}
                                            className="p-4 flex gap-3 hover:bg-slate-50 transition-colors block"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                notif.type === 'new_user' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                                {notif.type === 'new_user' ? <UserIcon size={14} /> : <ArrowRight size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.description}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-500">Only showing latest 5 alerts.</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-navy-dark">Admin User</p>
                        <p className="text-xs text-slate-500">{user?.email || 'admin@crowdpay.com'}</p>
                    </div>
                    <div className="w-9 h-9 bg-navy rounded-full flex items-center justify-center text-white font-bold">
                        <UserIcon size={18} />
                    </div>
                </div>
            </div>
        </header>
    )
}
