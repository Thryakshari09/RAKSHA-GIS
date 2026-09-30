import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  History,
  Download,
  RotateCcw,
  Trash2,
  Check,
  File as FileIcon,
  AlertCircle,
  X,
} from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';
import type { DocumentVersion } from '@/types';
import { formatDateTime, formatFileSize, isImage } from '@/utils/documents';

export default function VersionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    const v = await dataService.getVersions(id);
    setVersions(v);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handlePreview = async (versionId: string, mimeType: string | null) => {
    const fileData = await dataService.getVersionFile(versionId);
    if (!fileData) {
      showError('File not found.');
      return;
    }
    if (!isImage(mimeType) && mimeType !== 'application/pdf') {
      showError('Preview not available for this file type.');
      return;
    }
    const base64 = dataService.bytesToBase64(fileData.data, fileData.mimeType || undefined);
    setPreviewUrl(base64);
    setPreviewVersion(versionId);
  };

  const handleDownload = async (versionId: string) => {
    const fileData = await dataService.getVersionFile(versionId);
    if (!fileData) {
      showError('File not found.');
      return;
    }
    const base64 = dataService.bytesToBase64(fileData.data);
    const mime = fileData.mimeType || 'application/octet-stream';
    const link = document.createElement('a');
    link.href = `data:${mime};base64,${base64}`;
    link.download = fileData.originalFileName || 'document';
    link.click();
  };

  const handleRestore = async () => {
    if (!id || !restoreId) return;
    try {
      await dataService.restoreVersion(id, restoreId);
      showSuccess('Version restored successfully.');
      setRestoreId(null);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to restore.');
    }
  };

  const handleDelete = async () => {
    if (!id || !deleteId) return;
    try {
      await dataService.deleteVersion(id, deleteId);
      showSuccess('Version deleted.');
      setDeleteId(null);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/documents/${id}`} className="btn-ghost mb-4 inline-flex">
        <ArrowLeft className="h-4 w-4" /> Back to Document
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Version History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
          <p className="mt-3 text-sm text-slate-500">No versions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((v, idx) => (
            <div
              key={v.id}
              className={`card p-5 ${v.is_current ? 'border-teal-300 ring-1 ring-teal-200 dark:border-teal-800 dark:ring-teal-900' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <FileIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Version {v.version_number}
                    </span>
                    {v.is_current && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                        <Check className="h-3 w-3" /> Current
                      </span>
                    )}
                    {idx === versions.length - 1 && !v.is_current && (
                      <span className="text-xs text-slate-400">Original</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    Updated {formatDateTime(v.uploaded_at)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                    {v.original_file_name && <span>{v.original_file_name}</span>}
                    {v.file_size && <span>{formatFileSize(v.file_size)}</span>}
                    {v.mime_type && <span>{v.mime_type}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  onClick={() => handlePreview(v.id, v.mime_type)}
                  className="btn-ghost text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => handleDownload(v.id)}
                  className="btn-ghost text-sm"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                {!v.is_current && (
                  <>
                    <button
                      onClick={() => setRestoreId(v.id)}
                      className="btn-ghost text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                    >
                      <RotateCcw className="h-4 w-4" /> Restore
                    </button>
                    <button
                      onClick={() => setDeleteId(v.id)}
                      className="btn-ghost text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && previewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => { setPreviewUrl(null); setPreviewVersion(null); }} />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Version {versions.find((v) => v.id === previewVersion)?.version_number}
              </h3>
              <button onClick={() => { setPreviewUrl(null); setPreviewVersion(null); }} className="btn-ghost p-1.5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex max-h-[calc(90vh-56px)] items-center justify-center overflow-auto bg-slate-50 p-4 dark:bg-slate-950 scrollbar-thin">
              {previewUrl.startsWith('data:image/') ? (
                <img src={previewUrl} alt="Version preview" className="max-h-full max-w-full rounded-lg object-contain" />
              ) : previewUrl.startsWith('data:application/pdf') ? (
                <iframe src={previewUrl} title="Version preview" className="h-[80vh] w-full rounded-lg border-0" />
              ) : (
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm text-slate-500">Preview not available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restore confirmation */}
      {restoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setRestoreId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-scale-in dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Restore this version?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This will create a new version with the file from this version. The current version will remain in history.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRestoreId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleRestore} className="btn-primary">Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-scale-in dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete this version?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This will permanently remove this version's file. This cannot be undone.
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
