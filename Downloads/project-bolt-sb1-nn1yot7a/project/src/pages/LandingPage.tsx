import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  FileText,
  Clock,
  Bell,
  Lock,
  Search,
  History,
  Smartphone,
  CheckCircle,
  ArrowRight,
  FolderTree,
  Download,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20" />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-900/20" />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300">
              <Shield className="h-4 w-4" />
              Your family's documents, secured
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Every important document,
              <span className="block bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                organized in one secure vault
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Vaultly lets you manage Aadhaar, PAN, passports, insurance,
              certificates, and more — for every family member, all from one
              account. Track expiry dates, keep version history, and never lose
              a document again.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {user ? (
                <Link to="/dashboard" className="btn-primary px-6 py-3 text-base">
                  Open Your Vault <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Link to="/register" className="btn-primary px-6 py-3 text-base">
                  Create Your Vault <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              <Link to="/login" className="btn-secondary px-6 py-3 text-base">
                I already have an account
              </Link>
            </div>
          </div>

          {/* Family tree visual */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="card overflow-hidden p-0">
              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 p-6 dark:from-slate-900 dark:to-slate-900/50">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <FolderTree className="h-5 w-5" />
                  <span className="text-sm font-medium">Your Family Vault</span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { name: 'Father', docs: 12, icon: '👨', color: 'from-blue-500 to-blue-600' },
                    { name: 'Mother', docs: 10, icon: '👩', color: 'from-pink-500 to-pink-600' },
                    { name: 'Brother', docs: 8, icon: '👦', color: 'from-amber-500 to-amber-600' },
                    { name: 'Sister', docs: 7, icon: '👧', color: 'from-purple-500 to-purple-600' },
                  ].map((m) => (
                    <div
                      key={m.name}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-transform hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="text-3xl">{m.icon}</div>
                      <p className="mt-2 font-semibold text-slate-800 dark:text-white">{m.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {m.docs} documents
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything your family needs, in one place
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            From identity documents to certificates and vehicle papers — Vaultly
            keeps them organized, tracked, and secure.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Users,
              title: 'Multi-member management',
              desc: 'Add unlimited family members and organize documents under each person individually.',
            },
            {
              icon: FileText,
              title: 'All document types',
              desc: 'Aadhaar, PAN, passports, licences, insurance, certificates, vehicle docs, photos and more.',
            },
            {
              icon: History,
              title: 'Version history',
              desc: 'Update a document without losing the old version. Restore any previous version anytime.',
            },
            {
              icon: Clock,
              title: 'Expiry tracking',
              desc: 'Automatic status badges show what is valid, expiring soon, or already expired.',
            },
            {
              icon: Search,
              title: 'Powerful search',
              desc: 'Find any document instantly by name, family member, category, or file name.',
            },
            {
              icon: Bell,
              title: 'Smart notifications',
              desc: 'Get reminders before documents expire so you can renew on time, every time.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="card p-6 transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Security section */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Lock className="h-4 w-4" />
                Built for sensitive documents
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Security designed for personal documents
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Vaultly stores your family's documents with care. Your account is
                password-protected, each user's data is isolated, and your files
                stay private to you.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Password-protected accounts with hashed credentials',
                  'Each account only sees its own family members and documents',
                  'Documents are stored privately — never exposed via public links',
                  'Download files on demand through authenticated access',
                  'Files never leave your vault without your action',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" />
                    <span className="text-slate-700 dark:text-slate-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Lock, label: 'Hashed passwords', desc: 'PBKDF2 + salt' },
                { icon: Shield, label: 'Data isolation', desc: 'Per-account privacy' },
                { icon: Download, label: 'On-demand download', desc: 'Authenticated access' },
                { icon: Smartphone, label: 'Works everywhere', desc: 'Mobile, tablet, desktop' },
              ].map((item) => (
                <div key={item.label} className="card p-5">
                  <item.icon className="h-8 w-8 text-teal-500" />
                  <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-700 px-6 py-16 text-center shadow-xl">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start organizing your family's documents today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-50">
              Create your free vault and add your first family member in under a
              minute.
            </p>
            <div className="mt-8">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-teal-700 shadow-sm transition-all hover:bg-teal-50"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-teal-700 shadow-sm transition-all hover:bg-teal-50"
                >
                  Create Your Free Vault <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Vaultly. Your family's document vault.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
