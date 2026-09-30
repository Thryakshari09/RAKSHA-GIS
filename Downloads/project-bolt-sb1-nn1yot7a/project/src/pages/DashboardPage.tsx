import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import type { DashboardStats, FamilyMember, Document } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import DocumentIcon from '@/components/DocumentIcon';
import { formatDate, formatDateTime } from '@/utils/documents';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalFamilyMembers: 0,
    totalDocuments: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
  });
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, m, docs] = await Promise.all([
        dataService.getDashboardStats(),
        dataService.getFamilyMembers(),
        dataService.getDocuments({ sortBy: 'updated_desc' }),
      ]);
      setStats(s);
      setMembers(m);
      setRecentDocs(docs.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  const statCards = [
    {
      label: 'Family Members',
      value: stats.totalFamilyMembers,
      icon: Users,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      link: '/family',
    },
    {
      label: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
      link: '/documents',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
      link: '/documents',
    },
    {
      label: 'Expiring Soon',
      value: stats.expiringSoon,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
      link: '/expiring',
    },
    {
      label: 'Expired',
      value: stats.expired,
      icon: XCircle,
      color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
      link: '/expiring',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Welcome */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome to Vaultly{user ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Here's an overview of your family's document vault.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/family" className="btn-secondary">
            <Users className="h-4 w-4" /> Add Member
          </Link>
          <Link to="/documents/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Add Document
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="card p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '—' : card.value}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Family Members */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Family Members</h2>
            <Link to="/family" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400">
              View all
            </Link>
          </div>
          {members.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="mt-3 text-sm text-slate-500">No family members yet.</p>
              <Link to="/family" className="mt-3 inline-flex btn-secondary">
                <Plus className="h-4 w-4" /> Add your first member
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <Link
                  key={m.id}
                  to={`/family/${m.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-sm font-semibold text-white">
                    {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-slate-800 dark:text-white">{m.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {m.relationship || 'Family member'}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {m.document_count || 0} docs
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Expiry + Recent */}
        <div className="space-y-6">
          {/* Expiry alerts */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Expiry Alerts</h2>
              <Link to="/expiring" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Active</span>
                </div>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{stats.active}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Expiring Soon</span>
                </div>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.expiringSoon}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">Expired</span>
                </div>
                <span className="text-lg font-bold text-red-700 dark:text-red-400">{stats.expired}</span>
              </div>
            </div>
          </div>

          {/* Recently updated */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Recently Updated</h2>
              <Link to="/documents" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400">
                View all
              </Link>
            </div>
            {recentDocs.length === 0 ? (
              <div className="py-6 text-center">
                <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                <p className="mt-2 text-sm text-slate-500">No documents yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <DocumentIcon category={doc.category} mimeType={doc.mime_type} className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{doc.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {doc.family_member_name} · {formatDate(doc.updated_at)}
                      </p>
                    </div>
                    {doc.status && <StatusBadge status={doc.status} showDot={false} />}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
