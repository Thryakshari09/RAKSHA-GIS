import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/db/index';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyInvite = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        const tokenHash = params.get('token_hash');
        const type = params.get('type');

        // Invitation link using token_hash
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'invite',
          });

          if (error) {
            throw error;
          }

          // Remove sensitive token from the URL
          window.history.replaceState(
            {},
            document.title,
            '/reset-password'
          );

          setVerifying(false);
          return;
        }

        // Some Supabase links return the session in the URL hash.
        // Give Supabase a moment to process it.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setVerifying(false);
          return;
        }

        setError(
          'Invitation session is missing or has expired. Please request a new invitation.'
        );
        setVerifying(false);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to verify invitation.';

        setError(msg);
        setVerifying(false);
        showError(msg);
      }
    };

    verifyInvite();
  }, [showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Confirm that the invitation created a session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          'Auth session missing. Please open the invitation email again.'
        );
      }

      // Set the password for the invited user
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';

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
              Set a new password
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Choose a new password for your account
            </p>
          </div>

          <div className="card p-6 sm:p-8">

            {verifying ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Verifying your invitation...
                </p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center py-2 text-center">

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Password updated. Redirecting you to sign in...
                </p>

              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {!error && (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >

                    <div>
                      <label
                        className="label"
                        htmlFor="password"
                      >
                        New password
                      </label>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          id="password"
                          type="password"
                          className="input pl-10"
                          placeholder="Your new password"
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="label"
                        htmlFor="confirmPassword"
                      >
                        Confirm new password
                      </label>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          id="confirmPassword"
                          type="password"
                          className="input pl-10"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) =>
                            setConfirmPassword(e.target.value)
                          }
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {loading
                        ? 'Updating...'
                        : 'Update password'}
                    </button>

                  </form>
                )}

              </>
            )}

            <div className="mt-6 text-center text-sm">
              <Link
                to="/login"
                className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
              >
                Back to sign in
              </Link>
            </div>

          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="btn-ghost inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}