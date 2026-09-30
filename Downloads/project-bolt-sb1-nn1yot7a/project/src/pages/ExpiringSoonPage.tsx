import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Document } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import DocumentIcon from '@/components/DocumentIcon';
import { formatDate, daysUntilExpiry, calcStatus } from '@/utils/documents';

type Tab = 'expired' | '30' | '60' | '90';

export default function ExpiringSoonPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('30');
  const [sortBy, setSortBy] = useState('expiry_asc');

  useEffect(() => {
    (async () => {
      const all = await dataService.getDocuments({ sortBy });
      const withExpiry = all.filter((d) => d.expiry_date);
      setDocs(withExpiry);
      setLoading(false);
    })();
  }, [sortBy]);

  const filterByTab = (list: Document[]): Document[] => {
    return list.filter((doc) => {
      const days = daysUntilExpiry(doc.expiry_date);
      if (days === null) return false;
      if (tab === 'expired') return days < 0;
      if (tab === '30') return days >= 0 && days <= 30;
      if (tab === '60') return days > 30 && days <= 60;
      if (tab === '90') return days > 60 && days <= 90;
      return false;
    });
  };

  const filtered = filterByTab(docs);

  const tabs: { key: Tab; label: string; color: string }[] = [
    { key: 'expired', label: 'Expired', color: 'text-red-600 border-red-500' },
    { key: '30', label: '30 days', color: 'text-amber-600 border-amber-500' },
    { key: '60', label: '60 days', color: 'text-amber-600 border-amber-500' },
    { key: '90', label: '90 days', color: 'text-teal-600 border-teal-500' },
  ];

  const counts: Record<Tab, number> = {
    expired: docs.filter((d) => (daysUntilExpiry(d.expiry_date) ?? 1) < 0).length,
    '30': docs.filter((d) => { const days = daysUntilExpiry(d.expiry_date); return days !== null && days >= 0 && days <= 30; }).length,
    '60': docs.filter((d) => { const days = daysUntilExpiry(d.expiry_date); return days !== null && days > 30 && days <= 60; }).length,
    '90': docs.filter((d) => { const days = daysUntilExpiry(d.expiry_date); return days !== null && days > 60 && days <= 90; }).length,
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expiring Soon</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Track documents that need renewal before they expire.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? `${t.color} bg-slate-50 dark:bg-slate-800`
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
        <select className="input ml-auto w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="expiry_asc">Expiry Date (nearest)</option>
          <option value="expiry_desc">Expiry Date (farthest)</option>
          <option value="updated_desc">Recently Updated</option>
          <option value="name_asc">Name</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-emerald-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">
            {tab === 'expired' ? 'No expired documents' : 'Nothing expiring in this window'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {tab === 'expired' ? 'All your documents with expiry dates are still valid.' : 'Your documents are in good shape.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => {
            const days = daysUntilExpiry(doc.expiry_date);
            const status = calcStatus(doc.expiry_date);
            return (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="card flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <DocumentIcon category={doc.category} mimeType={doc.mime_type} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-slate-800 dark:text-white">{doc.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {doc.family_member_name} · {doc.document_type}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {doc.status && <StatusBadge status={doc.status} />}
                  <span className={`text-xs font-medium ${
                    days !== null && days < 0 ? 'text-red-500' :
                    days !== null && days <= 30 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    {days !== null && days < 0
                      ? `Expired ${Math.abs(days)} days ago`
                      : days !== null
                      ? `Expires in ${days} days`
                      : '—'}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(doc.expiry_date)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
