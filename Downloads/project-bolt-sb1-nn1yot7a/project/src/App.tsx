import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ToastContainer from '@/components/ToastContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/layouts/AppLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import FamilyMembersPage from '@/pages/FamilyMembersPage';
import FamilyMemberDetailPage from '@/pages/FamilyMemberDetailPage';
import AllDocumentsPage from '@/pages/AllDocumentsPage';
import AddDocumentPage from '@/pages/AddDocumentPage';
import DocumentDetailPage from '@/pages/DocumentDetailPage';
import VersionHistoryPage from '@/pages/VersionHistoryPage';
import ExpiringSoonPage from '@/pages/ExpiringSoonPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/family" element={<FamilyMembersPage />} />
                <Route path="/family/:id" element={<FamilyMemberDetailPage />} />
                <Route path="/documents" element={<AllDocumentsPage />} />
                <Route path="/documents/new" element={<AddDocumentPage />} />
                <Route path="/documents/:id" element={<DocumentDetailPage />} />
                <Route path="/documents/:id/versions" element={<VersionHistoryPage />} />
                <Route path="/expiring" element={<ExpiringSoonPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}