import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Users } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';
import type { FamilyMember } from '@/types';
import FamilyMemberModal from '@/components/FamilyMemberModal';
import { formatDate } from '@/utils/documents';

export default function FamilyMembersPage() {
  const { showSuccess, showError } = useToast();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const m = await dataService.getFamilyMembers();
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (data: Omit<FamilyMember, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'document_count'>) => {
    try {
      if (editing) {
        await dataService.updateFamilyMember(editing.id, data);
        showSuccess('Family member updated successfully.');
      } else {
        await dataService.addFamilyMember(data);
        showSuccess('Family member added successfully.');
      }
      await load();
      setEditing(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await dataService.deleteFamilyMember(deleteId);
      showSuccess('Family member deleted.');
      await load();
      setDeleteId(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Family Members</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage documents for each person in your family.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditing(null); setModalOpen(true); }}
        >
          <Plus className="h-4 w-4" /> Add Family Member
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">No family members yet</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Add your first family member to start organizing their documents.
          </p>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary mt-4">
            <Plus className="h-4 w-4" /> Add Family Member
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <div key={m.id} className="card p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-lg font-bold text-white">
                  {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-slate-900 dark:text-white">{m.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{m.relationship || 'Family member'}</p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    DOB: {formatDate(m.date_of_birth)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {m.document_count || 0} documents
                </span>
                <div className="flex gap-1">
                  <Link to={`/family/${m.id}`} className="btn-ghost p-2" title="View">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button onClick={() => { setEditing(m); setModalOpen(true); }} className="btn-ghost p-2" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(m.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FamilyMemberModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        member={editing}
      />

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-scale-in dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete family member?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This will permanently delete the family member and all their documents. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
