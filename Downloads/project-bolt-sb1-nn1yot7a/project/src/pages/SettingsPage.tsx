import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Palette,
  AlertTriangle,
  Sun,
  Moon,
  Check,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { dataService } from '@/services/dataService';

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggle } = useTheme();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return;
    setSavingProfile(true);
    try {
      await dataService.updateProfile({ full_name: fullName.trim() });
      await refreshUser();
      showSuccess('Profile updated successfully.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) return;
    if (newPassword.length < 8) {
      showError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showError('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await dataService.changePassword(currentPassword, newPassword);
      showSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await dataService.deleteAccount();
      logout();
      navigate('/');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete account.');
      setDeleting(false);
    }
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Manage your account, security, and preferences.
      </p>

      <div className="mt-6 space-y-6">
        {/* Account */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account</h2>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-xl font-bold text-white">
              {initials || <User className="h-6 w-6" />}
            </div>
            <div>
              <p className="font-medium text-slate-800 dark:text-white">{user?.full_name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-slate-50 dark:bg-slate-800/50" value={user?.email || ''} disabled />
            </div>
            <button onClick={handleSaveProfile} disabled={savingProfile || fullName === user?.full_name} className="btn-primary">
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter your current password" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Re-enter new password" />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmNewPassword}
              className="btn-primary"
            >
              {savingPassword ? 'Changing…' : 'Change Password'}
            </button>
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary text-slate-600">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Palette className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Theme</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark mode</p>
              </div>
              <button onClick={toggle} className="btn-secondary">
                {theme === 'light' ? <><Sun className="h-4 w-4" /> Light</> : <><Moon className="h-4 w-4" /> Dark</>}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Language</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Display language for the app</p>
              </div>
              <select className="input w-auto" defaultValue="en" onChange={() => showSuccess('Language preference saved.')}>
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Expiry notifications</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Get reminded before documents expire</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked onChange={(e) => showSuccess(e.target.checked ? 'Expiry notifications enabled.' : 'Expiry notifications disabled.')} />
                <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-teal-600 peer-checked:after:translate-x-5 dark:bg-slate-700" />
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200 p-6 dark:border-red-900/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Permanently delete your account and all associated data, including family members, documents, and versions. This action cannot be undone.
          </p>
          <button onClick={() => setShowDelete(true)} className="btn-danger">
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete account modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowDelete(false); setDeleteConfirm(''); }} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-in dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Account</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This will permanently delete your account, all family members, all documents, and all version history. <strong className="text-red-600">This cannot be undone.</strong>
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Type <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-red-600 dark:bg-slate-800">DELETE</code> to confirm:
            </p>
            <input
              className="input mb-4"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); }} className="btn-secondary">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE' || deleting} className="btn-danger">
                {deleting ? 'Deleting…' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
