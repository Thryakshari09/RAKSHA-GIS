import { useState, type FormEvent } from 'react';
import { Mail, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';

interface InviteMemberButtonProps {
  memberId: string;
  memberName: string;
  defaultEmail?: string | null;
}

export default function InviteMemberButton({
  memberId,
  memberName,
  defaultEmail,
}: InviteMemberButtonProps) {
  const { showError, showSuccess } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter an email address.');
      return;
    }
    setLoading(true);
    try {
      await dataService.setMemberLogin(memberId, email);
      setSent(true);
      showSuccess?.(`Invite sent to ${email}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
      showError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setOpen(false);
    setSent(false);
    setError('');
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        <Mail className="h-4 w-4" />
        Give login access
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Invite {memberName}
              </h2>
              <button type="button" onClick={close} aria-label="Close">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-teal-600" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Invite sent to <span className="font-medium">{email}</span>. They'll get an
                  email with a link to set their password and log in.
                </p>
                <button type="button" onClick={close} className="btn-primary mt-4 w-full">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  They'll get an email invite to set their own password. Once signed in, they'll
                  see the same shared family documents you do.
                </p>
                <div>
                  <label className="label" htmlFor="invite-email">
                    Email
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    className="input"
                    placeholder="them@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending…' : 'Send invite'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}