import { useState } from 'react';
import { X, Lock, Unlock } from 'lucide-react';
import type { FamilyMember } from '@/types';

interface FamilyMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<FamilyMember, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'document_count' | 'has_login' | 'password_hash'>) => Promise<void>;
  member?: FamilyMember | null;
}

export default function FamilyMemberModal({
  open,
  onClose,
  onSave,
  member,
}: FamilyMemberModalProps) {
  const [name, setName] = useState(member?.name || '');
  const [relationship, setRelationship] = useState(member?.relationship || '');
  const [dateOfBirth, setDateOfBirth] = useState(member?.date_of_birth || '');
  const [gender, setGender] = useState(member?.gender || '');
  const [phone, setPhone] = useState(member?.phone || '');
  const [email, setEmail] = useState(member?.email || '');
  const [notes, setNotes] = useState(member?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      relationship: relationship || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      phone: phone || null,
      email: email || null,
      profile_photo: member?.profile_photo || null,
      notes: notes || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl animate-scale-in dark:bg-slate-900 scrollbar-thin">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {member ? 'Edit Family Member' : 'Add Family Member'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="label" htmlFor="fm-name">Name *</label>
            <input id="fm-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="fm-rel">Relationship</label>
              <select id="fm-rel" className="input" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                <option value="">Select…</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Self">Self</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="fm-dob">Date of Birth</label>
              <input id="fm-dob" type="date" className="input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="fm-gender">Gender</label>
              <select id="fm-gender" className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="fm-phone">Phone</label>
              <input id="fm-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="fm-email">Email</label>
            <input id="fm-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address — needed for member login access" />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              An email is required if you want to give this person their own login access.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="fm-notes">Notes</label>
            <textarea id="fm-notes" className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : member ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
