import type { DocumentStatus } from '@/types';
import { statusLabel, statusColor, statusDot } from '@/utils/documents';

interface StatusBadgeProps {
  status: DocumentStatus | string;
  showDot?: boolean;
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(status)}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`} />}
      {statusLabel(status)}
    </span>
  );
}
