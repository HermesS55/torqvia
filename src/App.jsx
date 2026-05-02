import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import Layout from './components/layout/Layout'
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/Dashboard'
import Listings from './pages/listings/Listings'
import CreateListing from './pages/listings/CreateListing'
import ListingDetail from './pages/listings/ListingDetail'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import People from './pages/People'
import ComingSoon from './pages/ComingSoon'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import Terms from './pages/legal/Terms'
import Privacy from './pages/legal/Privacy'
import Refund from './pages/legal/Refund'
import Communities from './pages/communities/Communities'
import CommunityDetail from './pages/communities/CommunityDetail'
import CreateCommunity from './pages/communities/CreateCommunity'
import Garage from './pages/Garage'
import CarSales from './pages/sales/CarSales'
import CreateCarSale from './pages/sales/CreateCarSale'
import CarSaleDetail from './pages/sales/CarSaleDetail'
import SearchPage from './pages/Search'
import EditListing from './pages/listings/EditListing'
import Admin from './pages/Admin'
import PostDetail from './pages/PostDetail'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import PaymentCallback from './pages/payment/PaymentCallback'

function NotFound() {
  return (
    <div className="text-center py-20 max-w-sm mx-auto">
      <p className="text-8xl font-black text-zinc-800 mb-4">404</p>
      <h1 className="text-xl font-bold text-white mb-2">Sayfa bulunamadı</h1>
      <p className="text-zinc-500 text-sm mb-6">Aradığın sayfa mevcut değil ya da taşınmış olabilir.</p>
      <div className="flex items-center justify-center gap-3">
        <Link to="/feed" className="btn-primary">Ana Sayfaya Dön</Link>
        <Link to="/search" className="btn-secondary">Ara</Link>
      </div>
    </div>
  )
}

function HomeOrFeed() {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (!user) return <Home />
  const to = profile?.role === 'pro' ? '/listings' : '/dashboard'
  return <Navigate to={to} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeOrFeed />} />

            <Route path="/login"          element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register"       element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            {/* HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak */}
            <Route path="/feed"        element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
            {/* <Route path="/feed"        element={<ProtectedRoute><Feed /></ProtectedRoute>} /> */}
            <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            {/* HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak */}
            <Route path="/messages"    element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
            {/* <Route path="/messages"    element={<ProtectedRoute><Messages /></ProtectedRoute>} /> */}
            <Route path="/people"      element={<People />} />
            <Route path="/settings"    element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/pricing"     element={<Pricing />} />
            <Route path="/terms"       element={<Terms />} />
            <Route path="/privacy"     element={<Privacy />} />
            <Route path="/refund"      element={<Refund />} />

            <Route path="/listings"          element={<Listings />} />
            <Route path="/listings/new"      element={<ProtectedRoute requiredRole="owner"><CreateListing /></ProtectedRoute>} />
            <Route path="/listings/:id"      element={<ListingDetail />} />
            <Route path="/listings/:id/edit" element={<ProtectedRoute requiredRole="owner"><EditListing /></ProtectedRoute>} />

            <Route path="/communities"     element={<Communities />} />
            <Route path="/communities/new" element={<ProtectedRoute><CreateCommunity /></ProtectedRoute>} />
            <Route path="/communities/:id" element={<ProtectedRoute><CommunityDetail /></ProtectedRoute>} />

            <Route path="/garage"    element={<ProtectedRoute><Garage /></ProtectedRoute>} />
            <Route path="/sales"        element={<ProtectedRoute><CarSales /></ProtectedRoute>} />
            <Route path="/sales/new"    element={<ProtectedRoute><CreateCarSale /></ProtectedRoute>} />
            <Route path="/sales/:id"    element={<ProtectedRoute><CarSaleDetail /></ProtectedRoute>} />
            <Route path="/search"    element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/admin"     element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            {/* HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak */}
            <Route path="/posts/:id" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
            {/* <Route path="/posts/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} /> */}
            <Route path="/events"          element={<Events />} />
            <Route path="/events/:id"     element={<EventDetail />} />
            <Route path="/payment/success" element={<PaymentCallback />} />
            <Route path="/payment/failed"  element={<PaymentCallback />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  )
}
