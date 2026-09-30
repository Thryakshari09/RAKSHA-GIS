import {
  FileText,
  Image as ImageIcon,
  CreditCard,
  Award,
  Car,
  Camera,
  File,
} from 'lucide-react';

interface DocumentIconProps {
  category: string;
  mimeType?: string | null;
  className?: string;
}

export default function DocumentIcon({
  category,
  mimeType,
  className = 'h-6 w-6',
}: DocumentIconProps) {
  const isImage = mimeType?.startsWith('image/');
  if (isImage) return <ImageIcon className={className} />;

  const categoryIcons: Record<string, typeof FileText> = {
    Identity: CreditCard,
    Cards: CreditCard,
    Certificates: Award,
    Vehicle: Car,
    Photos: Camera,
    Other: File,
  };
  const Icon = categoryIcons[category] || FileText;
  return <Icon className={className} />;
}
