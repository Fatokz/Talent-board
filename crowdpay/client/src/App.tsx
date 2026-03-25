import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import SocialDashboard from './pages/SocialDashboard'
import PendingApprovals from './pages/PendingApprovals'
import GroupManagement from './pages/GroupManagement'
import TransactionLedger from './pages/TransactionLedger'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'
import SignInPage from './pages/auth/SignInPage'
import SignUpPage from './pages/auth/SignUpPage'
import Marketplace from './pages/Marketplace'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import VendorDashboard from './pages/VendorDashboard'
import InvitePage from './pages/InvitePage'
import './index.css'

/* ── Authenticated app shell (sidebar + inner pages) ─────────────────── */
function AppShell() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 modal-overlay lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 overflow-y-auto">
                <Routes>
                    <Route path="/" element={<SocialDashboard onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/profile" element={<ProfilePage onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/notifications" element={<PendingApprovals onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/groups" element={<GroupManagement onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/ledger" element={<TransactionLedger onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/marketplace" element={<Marketplace onMenuClick={() => setSidebarOpen(true)} />} />
                    
                    {/* Vendor Routes */}
                    <Route path="/vendor" element={<VendorDashboard onMenuClick={() => setSidebarOpen(true)} />} />
                </Routes>
            </main>
        </div>
    )
}

/* ── Root router ─────────────────────────────────────────────────────── */
function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-center" />
            <AuthProvider>
                <Routes>
                    {/* Public pages */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/invite/:jarId" element={<InvitePage />} />

                    {/* Authenticated app shell — all dashboard sub-routes live here */}
                    <Route
                        path="/dashboard/*"
                        element={
                            <ProtectedRoute>
                                <AppShell />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
