import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Phone,
  Mail,
  Calendar,
  Pencil,
  Trash2,
  FileText,
  Lock,
  Unlock,
  KeyRound,
  Shield,
} from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';
import type { FamilyMember, Document } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import DocumentIcon from '@/components/DocumentIcon';
import FamilyMemberModal from '@/components/FamilyMemberModal';
import { formatDate } from '@/utils/documents';

export default function FamilyMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [savingAccess, setSavingAccess] = useState(false);

  const load = async () => {
    if (!id) return;
    const [m, d] = await Promise.all([
      dataService.getFamilyMember(id),
      dataService.getDocumentsByFamilyMember(id),
    ]);
    setMember(m);
    setDocs(d);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const hasLogin = !!member?.auth_user_id;

  const handleSave = async (
    data: Omit<FamilyMember, 'id' | 'owner_id' | 'auth_user_id' | 'created_at' | 'updated_at' | 'document_count'>
  ) => {
    if (!id) return;
    await dataService.updateFamilyMember(id, data);
    showSuccess('Family member updated.');
    await load();
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await dataService.deleteFamilyMember(id);
    showSuccess('Family member deleted.');
    navigate('/family');
  };

  const openAccessModal = () => {
    setInviteEmail(member?.email ?? '');
    setAccessModalOpen(true);
  };

  const handleSendInvite = async () => {
    if (!id || !inviteEmail) return;
    setSavingAccess(true);
    try {
      await dataService.setMemberLogin(id, inviteEmail);
      showSuccess(`Invite sent to ${inviteEmail}. They'll get an email to set their password.`);
      setAccessModalOpen(false);
      setInviteEmail('');
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send invite.');
    } finally {
      setSavingAccess(false);
    }
  };

  const handleDisableAccess = async () => {
    if (!id) return;
    try {
      await dataService.removeMemberLogin(id);
      showSuccess(`Login access removed for ${member?.name}.`);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove access.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-5xl text-center py-12">
        <p className="text-slate-500">Family member not found.</p>
        <Link to="/family" className="btn-secondary mt-4">Back to Family Members</Link>
      </div>
    );
  }

  const docsByCategory = docs.reduce<Record<string, Document[]>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  const categories = ['Identity', 'Cards', 'Certificates', 'Vehicle', 'Photos', 'Other'];

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/family" className="btn-ghost mb-4 inline-flex">
        <ArrowLeft className="h-4 w-4" /> Back to Family
      </Link>

      {/* Member profile card */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-teal-500 to-emerald-600" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-teal-400 to-emerald-500 text-2xl font-bold text-white dark:border-slate-900">
                {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="pb-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{member.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{member.relationship || 'Family member'}</p>
                {hasLogin && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    <Shield className="h-3 w-3" /> Has login access
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalOpen(true)} className="btn-secondary">
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button onClick={handleDelete} className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(member.date_of_birth)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
              <Phone className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{member.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
              <Mail className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{member.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
              <FileText className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Documents</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{docs.length}</p>
              </div>
            </div>
          </div>

          {member.notes && (
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Notes</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{member.notes}</p>
            </div>
          )}

          {/* Login access section */}
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/30">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-white">Individual Login Access</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {hasLogin
                    ? 'This member has their own login and can see all shared family documents.'
                    : "Invite this person by email so they can set their own password and sign in — they'll see the same shared family documents you do."}
                </p>
              </div>
              {hasLogin ? (
                <button onClick={handleDisableAccess} className="btn-secondary text-sm">
                  <Unlock className="h-4 w-4" /> Remove Access
                </button>
              ) : (
                <button onClick={openAccessModal} className="btn-primary text-sm">
                  <Lock className="h-4 w-4" /> Invite to Log In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents by category */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Documents</h2>
          <Link to={`/documents/new?familyMemberId=${member.id}`} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Document
          </Link>
        </div>

        {docs.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
            <p className="mt-3 text-sm text-slate-500">No documents for this member yet.</p>
            <Link to={`/documents/new?familyMemberId=${member.id}`} className="btn-secondary mt-3">
              <Plus className="h-4 w-4" /> Add their first document
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const catDocs = docsByCategory[cat];
              if (!catDocs || catDocs.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {cat}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {catDocs.map((doc) => (
                      <Link
                        key={doc.id}
                        to={`/documents/${doc.id}`}
                        className="card p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <DocumentIcon category={doc.category} mimeType={doc.mime_type} className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{doc.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{doc.document_type}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                          {doc.status && <StatusBadge status={doc.status} />}
                          <span className="text-xs text-slate-400">{formatDate(doc.updated_at)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FamilyMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        member={member}
      />

      {/* Invite-to-login modal */}
      {accessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => { setAccessModalOpen(false); setInviteEmail(''); }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-in dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Invite {member.name} to log in</h3>
              </div>
              <button
                onClick={() => { setAccessModalOpen(false); setInviteEmail(''); }}
                className="btn-ghost p-1.5"
              >
                <ArrowLeft className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              They'll get an email with a link to set their own password. Once signed in, they'll
              see the same shared family documents you do.
            </p>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="them@example.com"
                autoFocus
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setAccessModalOpen(false); setInviteEmail(''); }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={savingAccess || !inviteEmail}
                className="btn-primary"
              >
                {savingAccess ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}