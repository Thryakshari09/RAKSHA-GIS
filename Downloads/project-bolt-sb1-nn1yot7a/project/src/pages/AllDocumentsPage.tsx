import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, FileText, X } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Document, FamilyMember } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import DocumentIcon from '@/components/DocumentIcon';
import { formatDate, formatFileSize, CATEGORIES, getTypesForCategory } from '@/utils/documents';

export default function AllDocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docs, setDocs] = useState<Document[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [familyMemberId, setFamilyMemberId] = useState('');
  const [category, setCategory] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('updated_desc');

  const load = async () => {
    setLoading(true);
    const [d, m] = await Promise.all([
      dataService.getDocuments({
        familyMemberId: familyMemberId || undefined,
        category: category || undefined,
        documentType: documentType || undefined,
        search: search || undefined,
        sortBy,
      }),
      dataService.getFamilyMembers(),
    ]);
    let filtered = d;
    if (status) {
      filtered = d.filter((doc) => doc.status === status);
    }
    setDocs(filtered);
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => {
    const s = searchParams.get('search');
    if (s && s !== search) {
      setSearch(s);
    }
    load();
  }, [searchParams, familyMemberId, category, documentType, status, sortBy, search]);

  const updateSearchUrl = (value: string) => {
    setSearch(value);
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setFamilyMemberId('');
    setCategory('');
    setDocumentType('');
    setStatus('');
    setSortBy('updated_desc');
    updateSearchUrl('');
  };

  const hasFilters = familyMemberId || category || documentType || status || search;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Documents</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {loading ? 'Loading…' : `${docs.length} document${docs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/documents/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Document
        </Link>
      </div>

      {/* Search & filter bar */}
      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-10"
              placeholder="Search by name, member, category, file…"
              value={search}
              onChange={(e) => updateSearchUrl(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary ${showFilters ? 'border-teal-500 text-teal-600' : ''}`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <select className="input w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="updated_desc">Recently Updated</option>
              <option value="updated_asc">Oldest</option>
              <option value="expiry_asc">Expiry Date</option>
              <option value="name_asc">Name</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Family Member</label>
              <select className="input" value={familyMemberId} onChange={(e) => setFamilyMemberId(e.target.value)}>
                <option value="">All members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setDocumentType(''); }}>
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Document Type</label>
              <select className="input" value={documentType} onChange={(e) => setDocumentType(e.target.value)} disabled={!category}>
                <option value="">All types</option>
                {category && getTypesForCategory(category).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="active">Valid</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="no_expiry">No Expiry</option>
              </select>
            </div>
          </div>
        )}

        {hasFilters && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">Filters applied</p>
            <button onClick={clearFilters} className="btn-ghost text-sm text-teal-600">
              <X className="h-4 w-4" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">No documents found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {hasFilters ? 'Try adjusting your filters or search.' : 'Add your first document to get started.'}
          </p>
          {!hasFilters && (
            <Link to="/documents/new" className="btn-primary mt-4">
              <Plus className="h-4 w-4" /> Add Document
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="card p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <DocumentIcon category={doc.category} mimeType={doc.mime_type} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-slate-800 dark:text-white">{doc.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {doc.family_member_name} · {doc.document_type}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {doc.status && <StatusBadge status={doc.status} />}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{formatFileSize(doc.file_size)}</p>
                  <p className="text-xs text-slate-400">{formatDate(doc.updated_at)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
