import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  FileText,
  Upload,
  RefreshCw,
  Shield,
  Clock,
} from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';
import type { Notification } from '@/types';
import { formatDateTime } from '@/utils/documents';

const typeIcons: Record<string, typeof Bell> = {
  upload: Upload,
  update: RefreshCw,
  expiry: Clock,
  security: Shield,
  info: FileText,
};

const typeColors: Record<string, string> = {
  upload: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
  update: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  expiry: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  security: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  info: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function NotificationsPage() {
  const { showSuccess } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const n = await dataService.getNotifications();
    setNotifications(n);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id: string) => {
    await dataService.markNotificationRead(id);
    await load();
  };

  const handleMarkAllRead = async () => {
    await dataService.markAllNotificationsRead();
    showSuccess('All notifications marked as read.');
    await load();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary">
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">No notifications</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You'll see document updates, expiry reminders, and security alerts here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            const color = typeColors[n.type] || typeColors.info;
            return (
              <div
                key={n.id}
                className={`card flex items-start gap-4 p-4 transition-colors ${
                  !n.read ? 'border-teal-200 bg-teal-50/30 dark:border-teal-900 dark:bg-teal-950/10' : ''
                }`}
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 dark:text-white">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-teal-500" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {!n.read && (
                    <button onClick={() => handleMarkRead(n.id)} className="btn-ghost p-1.5 text-sm" title="Mark as read">
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  {n.document_id && (
                    <Link to={`/documents/${n.document_id}`} className="btn-ghost p-1.5 text-sm" title="View document">
                      <FileText className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
