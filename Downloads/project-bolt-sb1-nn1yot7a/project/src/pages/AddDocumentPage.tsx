import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  File as FileIcon,
  X,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';
import type { FamilyMember } from '@/types';
import {
  CATEGORIES,
  getTypesForCategory,
  validateFile,
  fileToBase64,
  formatDate,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
} from '@/utils/documents';

const steps = ['Member', 'Category', 'Type', 'Upload', 'Details', 'Review'];

export default function AddDocumentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState(0);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [familyMemberId, setFamilyMemberId] = useState(searchParams.get('familyMemberId') || '');
  const [category, setCategory] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Load members lazily when we reach step 0
  if (!membersLoaded) {
    dataService.getFamilyMembers().then((m) => {
      setMembers(m);
      setMembersLoaded(true);
    });
  }

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const canProceed = () => {
    if (step === 0) return !!familyMemberId;
    if (step === 1) return !!category;
    if (step === 2) return !!documentType;
    if (step === 3) return !!file;
    if (step === 4) return !!title.trim();
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const err = validateFile(selected);
    if (err) {
      setFileError(err);
      setFile(null);
      return;
    }
    setFileError('');
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (!selected) return;
    const err = validateFile(selected);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError('');
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ''));
  };

  const handleSave = async () => {
    if (!file || !familyMemberId || !category || !documentType || !title.trim()) return;
    setSaving(true);
    setUploadProgress(10);
    try {
      const base64 = await fileToBase64(file);
      setUploadProgress(60);
      await dataService.createDocument(
        {
          family_member_id: familyMemberId,
          category,
          document_type: documentType,
          title: title.trim(),
          description: description || null,
          document_number: documentNumber || null,
          issue_date: issueDate || null,
          expiry_date: expiryDate || null,
        },
        {
          base64,
          originalFileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }
      );
      setUploadProgress(100);
      showSuccess('Document added to your vault.');
      navigate(`/documents`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to upload document.');
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const selectedMember = members.find((m) => m.id === familyMemberId);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/documents" className="btn-ghost mb-4 inline-flex">
        <ArrowLeft className="h-4 w-4" /> Back to Documents
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Document</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Upload a document in a few quick steps.
      </p>

      {/* Stepper */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    i < step
                      ? 'bg-teal-600 text-white'
                      : i === step
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100 dark:ring-teal-950'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`mt-1.5 hidden text-xs sm:block ${i <= step ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 rounded-full ${i < step ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        {/* Step 0: Member */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select family member</h2>
            <p className="mt-1 text-sm text-slate-500">Who is this document for?</p>
            {members.length === 0 ? (
              <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                No family members yet. <Link to="/family" className="font-semibold underline">Add one first</Link>.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setFamilyMemberId(m.id)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      familyMemberId === m.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-sm font-semibold text-white">
                      {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.relationship || 'Family member'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Category */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select category</h2>
            <p className="mt-1 text-sm text-slate-500">What type of category is this?</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setCategory(c.name); setDocumentType(''); }}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    category === c.name
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <p className="font-medium text-slate-800 dark:text-white">{c.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.types.length} types</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Type */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select document type</h2>
            <p className="mt-1 text-sm text-slate-500">What specific document is this?</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {getTypesForCategory(category).map((t) => (
                <button
                  key={t}
                  onClick={() => setDocumentType(t)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    documentType === t
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <p className="font-medium text-slate-800 dark:text-white">{t}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Upload */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload file</h2>
            <p className="mt-1 text-sm text-slate-500">
              Allowed: {ALLOWED_EXTENSIONS.join(', ').toUpperCase()} · Max {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB
            </p>
            {fileError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
            {file ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <FileIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB · {file.type}</p>
                </div>
                <button onClick={() => setFile(null)} className="btn-ghost p-1.5 text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition-colors hover:border-teal-400 hover:bg-teal-50/50 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-teal-500"
              >
                <Upload className="h-10 w-10 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Click to browse or drag a file here
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, WEBP, or PDF
                </p>
                <input type="file" className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf,.webp" />
              </label>
            )}
          </div>
        )}

        {/* Step 4: Details */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Document details</h2>
            <p className="mt-1 text-sm text-slate-500">Enter the document information.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Document Title *</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Father's Passport" />
              </div>
              <div>
                <label className="label">Document Number</label>
                <input className="input" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Optional" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Issue Date</label>
                  <input type="date" className="input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Expiry Date</label>
                  <input type="date" className="input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes about this document" />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Review</h2>
            <p className="mt-1 text-sm text-slate-500">Check everything looks correct before saving.</p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Family Member', value: selectedMember?.name },
                { label: 'Category', value: category },
                { label: 'Document Type', value: documentType },
                { label: 'Title', value: title },
                { label: 'Document Number', value: documentNumber || '—' },
                { label: 'Issue Date', value: formatDate(issueDate) },
                { label: 'Expiry Date', value: formatDate(expiryDate) },
                { label: 'File', value: file?.name },
                { label: 'File Size', value: file ? `${(file.size / 1024).toFixed(0)} KB` : '—' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">{row.value || '—'}</span>
                </div>
              ))}
            </div>
            {saving && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <button onClick={prev} disabled={step === 0 || saving} className="btn-secondary">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={next} disabled={!canProceed()} className="btn-primary">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save Document'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
