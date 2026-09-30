import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-lg' },
    md: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-xl' },
    lg: { box: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-2xl' },
  };
  const s = sizes[size];
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${s.box} flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm`}
      >
        <Shield className={s.icon} />
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight text-slate-800 dark:text-white`}>
          Vault<span className="text-teal-600">ly</span>
        </span>
      )}
    </Link>
  );
}
