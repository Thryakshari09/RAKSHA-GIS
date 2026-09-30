import type { Document, DocumentStatus } from '@/types';

export function calcStatus(expiryDate: string | null): DocumentStatus {
  if (!expiryDate) return 'no_expiry';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'active';
}

export function daysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function statusLabel(status: DocumentStatus | string): string {
  const labels: Record<string, string> = {
    active: 'Valid',
    expiring_soon: 'Expiring Soon',
    expired: 'Expired',
    no_expiry: 'No Expiry',
  };
  return labels[status] || status;
}

export function statusColor(status: DocumentStatus | string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    expiring_soon: 'bg-amber-100 text-amber-700 border-amber-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    no_expiry: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return colors[status] || 'bg-slate-100 text-slate-600 border-slate-200';
}

export function statusDot(status: DocumentStatus | string): string {
  const dots: Record<string, string> = {
    active: 'bg-emerald-500',
    expiring_soon: 'bg-amber-500',
    expired: 'bg-red-500',
    no_expiry: 'bg-slate-400',
  };
  return dots[status] || 'bg-slate-400';
}

export function applyStatus(doc: Document): Document {
  return { ...doc, status: calcStatus(doc.expiry_date) };
}

export const CATEGORIES: { name: string; types: string[] }[] = [
  {
    name: 'Identity',
    types: [
      'Aadhaar',
      'PAN Card',
      'Passport',
      'Voter ID',
      'Driving Licence',
    ],
  },
  {
    name: 'Cards',
    types: ['Insurance Card', 'Health Card', 'College ID', 'Employee ID'],
  },
  {
    name: 'Certificates',
    types: [
      'Birth Certificate',
      'Degree',
      'Marksheets',
      'Training Certificate',
      'Internship Certificate',
    ],
  },
  {
    name: 'Vehicle',
    types: ['RC', 'Vehicle Insurance', 'PUC'],
  },
  {
    name: 'Photos',
    types: ['Passport Photo', 'Signature', 'Other Photo'],
  },
  {
    name: 'Other',
    types: ['Custom Document'],
  },
];

export function getTypesForCategory(category: string): string[] {
  const cat = CATEGORIES.find((c) => c.name === category);
  return cat ? cat.types : ['Custom Document'];
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'webp'];
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'File size exceeds the 15MB limit.';
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'This file type is not supported. Allowed: JPG, PNG, WEBP, PDF.';
  }
  return null;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const byteStr = atob(parts[1]);
  const arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) {
    arr[i] = byteStr.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

export function isImage(mimeType: string | null | undefined): boolean {
  return mimeType?.startsWith('image/') ?? false;
}

export function isPdf(mimeType: string | null | undefined): boolean {
  return mimeType === 'application/pdf';
}
