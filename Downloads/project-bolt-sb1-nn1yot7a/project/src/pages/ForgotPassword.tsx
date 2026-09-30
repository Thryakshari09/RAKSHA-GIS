import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/db/index';

export default function ForgotPasswordPage() {
  const { showError } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            <Logo size="lg" />
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
              Forgot password?
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <div className="card p-6 sm:p-8">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {sent ? (
              <div className="flex flex-col items-center py-2 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  If an account exists for <span className="font-medium">{email}</span>, a reset
                  link is on its way. Check your inbox (and spam folder).
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      className="input pl-10"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400">
                Back to sign in
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="btn-ghost inline-flex">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}