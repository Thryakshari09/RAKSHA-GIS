import { useToast } from '@/context/ToastContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle
            : toast.type === 'error'
            ? XCircle
            : Info;
        const colors = {
          success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          error: 'bg-red-50 border-red-200 text-red-800',
          info: 'bg-blue-50 border-blue-200 text-blue-800',
        };
        const iconColor = {
          success: 'text-emerald-500',
          error: 'text-red-500',
          info: 'text-blue-500',
        };
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-up ${colors[toast.type]}`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColor[toast.type]}`} />
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
