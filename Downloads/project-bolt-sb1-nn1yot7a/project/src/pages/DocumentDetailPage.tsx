import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  History,
  Trash2,
  Upload,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';
import type { Document } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import DocumentIcon from '@/components/DocumentIcon';
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  validateFile,
  fileToBase64,
  isImage,
  isPdf,
} from '@/utils/documents';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    if (!id) return;
    const d = await dataService.getDocument(id);
    setDoc(d);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handlePreview = async () => {
    if (!id) return;
    const fileData = await dataService.getCurrentVersionFile(id);
    if (!fileData) {
      showError('File not found.');
      return;
    }
    const base64 = dataService.bytesToBase64(fileData.data, fileData.mimeType || undefined);
    setPreviewUrl(base64);
    setPreviewOpen(true);
  };

  const handleDownload = async () => {
    if (!id) return;
    const fileData = await dataService.getCurrentVersionFile(id);
    if (!fileData) {
      showError('File not found.');
      return;
    }
    const base64 = dataService.bytesToBase64(fileData.data);
    const mime = fileData.mimeType || 'application/octet-stream';
    const link = document.createElement('a');
    link.href = `data:${mime};base64,${base64}`;
    link.download = fileData.originalFileName || doc?.title || 'document';
    link.click();
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dataService.deleteDocument(id);
      showSuccess('Document deleted.');
      navigate('/documents');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleUpdateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const err = validateFile(selected);
    if (err) {
      showError(err);
      return;
    }
    setUpdateFile(selected);
  };

  const handleUpdateSubmit = async () => {
    if (!id || !updateFile) return;
    setUpdating(true);
    try {
      const base64 = await fileToBase64(updateFile);
      await dataService.addDocumentVersion(id, {
        base64,
        originalFileName: updateFile.name,
        mimeType: updateFile.type,
        fileSize: updateFile.size,
      });
      showSuccess(`Document updated to version ${(doc?.current_version || 1) + 1}.`);
      setShowUpdate(false);
      setUpdateFile(null);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-4xl text-center py-12">
        <p className="text-slate-500">Document not found.</p>
        <Link to="/documents" className="btn-secondary mt-4">Back to Documents</Link>
      </div>
    );
  }

  const imagePreview = previewUrl && isImage(doc.mime_type);
  const pdfPreview = previewUrl && isPdf(doc.mime_type);

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/documents" className="btn-ghost mb-4 inline-flex">
        <ArrowLeft className="h-4 w-4" /> Back to Documents
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document info */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <DocumentIcon category={doc.category} mimeType={doc.mime_type} className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{doc.title}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {doc.family_member_name} · {doc.category} · {doc.document_type}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {doc.status && <StatusBadge status={doc.status} />}
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    v{doc.current_version}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={handlePreview} className="btn-primary">
                <Eye className="h-4 w-4" /> View
              </button>
              <button onClick={handleDownload} className="btn-secondary">
                <Download className="h-4 w-4" /> Download
              </button>
              <button onClick={() => setShowUpdate(true)} className="btn-secondary">
                <Upload className="h-4 w-4" /> Update
              </button>
              <Link to={`/documents/${doc.id}/versions`} className="btn-secondary">
                <History className="h-4 w-4" /> Version History
              </Link>
              <button onClick={() => setShowDelete(true)} className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>

          {doc.description && (
            <div className="card mt-4 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{doc.description}</p>
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Details</h3>
            <dl className="space-y-3">
              {[
                { label: 'Document Number', value: doc.document_number || '—' },
                { label: 'Issue Date', value: formatDate(doc.issue_date) },
                { label: 'Expiry Date', value: formatDate(doc.expiry_date) },
                { label: 'File Type', value: doc.mime_type || '—' },
                { label: 'File Size', value: formatFileSize(doc.file_size) },
                { label: 'File Name', value: doc.original_file_name || '—' },
                { label: 'Uploaded', value: formatDateTime(doc.created_at) },
                { label: 'Last Updated', value: formatDateTime(doc.updated_at) },
              ].map((row) => (
                <div key={row.label} className="flex flex-col">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{row.label}</dt>
                  <dd className="text-sm font-medium text-slate-800 dark:text-white break-words">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => { setPreviewOpen(false); setPreviewUrl(null); }} />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{doc.title}</h3>
              <button onClick={() => { setPreviewOpen(false); setPreviewUrl(null); }} className="btn-ghost p-1.5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex max-h-[calc(90vh-56px)] items-center justify-center overflow-auto bg-slate-50 p-4 dark:bg-slate-950 scrollbar-thin">
              {imagePreview && (
                <img src={previewUrl} alt={doc.title} className="max-h-full max-w-full rounded-lg object-contain" />
              )}
              {pdfPreview && (
                <iframe src={previewUrl} title={doc.title} className="h-[80vh] w-full rounded-lg border-0" />
              )}
              {!imagePreview && !pdfPreview && (
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm text-slate-500">Preview not available for this file type.</p>
                  <button onClick={handleDownload} className="btn-secondary mt-3">
                    <Download className="h-4 w-4" /> Download instead
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update modal */}
      {showUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setShowUpdate(false); setUpdateFile(null); }} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-in dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Update Document</h3>
              <button onClick={() => { setShowUpdate(false); setUpdateFile(null); }} className="btn-ghost p-1.5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Upload a new file. The current version will be preserved in version history.
            </p>
            {updateFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{updateFile.name}</p>
                  <p className="text-xs text-slate-500">{(updateFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => setUpdateFile(null)} className="btn-ghost p-1 text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-teal-400 dark:border-slate-700 dark:bg-slate-800/30">
                <Upload className="h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">Click to browse</p>
                <p className="text-xs text-slate-500">JPG, PNG, WEBP, or PDF</p>
                <input type="file" className="hidden" onChange={handleUpdateFile} accept=".jpg,.jpeg,.png,.pdf,.webp" />
              </label>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowUpdate(false); setUpdateFile(null); }} className="btn-secondary">Cancel</button>
              <button onClick={handleUpdateSubmit} disabled={!updateFile || updating} className="btn-primary">
                {updating ? 'Uploading…' : 'Upload New Version'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-scale-in dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete document?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This will permanently delete "{doc.title}" and all its versions. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDelete(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
