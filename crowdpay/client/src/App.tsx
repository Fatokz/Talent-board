import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import VendorSidebar from './components/VendorSidebar'
import MerchantOnboardingModal from './components/MerchantOnboardingModal'
import { useAuth } from './contexts/AuthContext'
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
import VendorOverview from './pages/vendor/VendorOverview'
import VendorProducts from './pages/vendor/VendorProducts'
import VendorOrders from './pages/vendor/VendorOrders'
import VendorPayouts from './pages/vendor/VendorPayouts'
import VendorSettings from './pages/vendor/VendorSettings'
import VendorKyc from './pages/vendor/VendorKyc'
import VendorProfilePage from './pages/vendor/VendorProfilePage'
import InvitePage from './pages/InvitePage'
import './index.css'

/* ── Authenticated app shell (sidebar + inner pages) ─────────────────── */
function AppShell() {
    const { currentUser } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
    const [onboardingOpen, setOnboardingOpen] = useState(false)
    const location = useLocation()
    const isVendorMode = location.pathname.startsWith('/dashboard/vendor')

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-[40] modal-overlay lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div key={isVendorMode ? 'vendor' : 'user'} className="animate-fade-in z-50 lg:shrink-0 h-full">
                {isVendorMode ? (
                    <VendorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                ) : (
                    <Sidebar 
                        isOpen={sidebarOpen} 
                        onClose={() => setSidebarOpen(false)} 
                        onOpenOnboarding={() => setOnboardingOpen(true)} 
                    />
                )}
            </div>

            <main className="flex-1 overflow-y-auto">
                <Routes>
                    <Route path="/" element={<SocialDashboard onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/profile" element={<ProfilePage onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/notifications" element={<PendingApprovals onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/groups" element={<GroupManagement onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/ledger" element={<TransactionLedger onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/marketplace" element={<Marketplace onMenuClick={() => setSidebarOpen(true)} />} />
                    
                    {/* Vendor Routes */}
                    <Route path="/vendor" element={<VendorOverview onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/vendor/products" element={<VendorProducts onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/vendor/orders" element={<VendorOrders onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/vendor/payouts" element={<VendorPayouts onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/vendor/settings" element={<VendorSettings onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/vendor/kyc" element={<VendorKyc onMenuClick={() => setSidebarOpen(true)} />} />
                    <Route path="/vendor/profile" element={<VendorProfilePage onMenuClick={() => setSidebarOpen(true)} />} />
                </Routes>
            </main>

            {currentUser && (
                <MerchantOnboardingModal 
                    isOpen={onboardingOpen} 
                    onClose={() => setOnboardingOpen(false)} 
                    uid={currentUser.uid} 
                />
            )}
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
