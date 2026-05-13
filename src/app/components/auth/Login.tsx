import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, Users, BarChart3, Shield } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface LoginProps {
  onLogin: (role: 'admin' | 'agent' | 'technicien' | 'commercial' | 'client') => void;
  onGoRegister: () => void;
}

const features = [
  { icon: Users,      text: 'Gestion centralisée des clients et contacts'   },
  { icon: BarChart3,  text: 'Tableaux de bord et statistiques en temps réel' },
  { icon: Shield,     text: 'Accès sécurisé selon votre rôle'               },
];

const demoAccounts = [
  { role: 'admin'      as const, label: 'Admin',      email: 'admin@nexuscrm.ma'      },
  { role: 'agent'      as const, label: 'Agent',      email: 'agent@nexuscrm.ma'      },
  { role: 'technicien' as const, label: 'Technicien', email: 'tech@nexuscrm.ma'       },
  { role: 'commercial' as const, label: 'Commercial', email: 'commercial@nexuscrm.ma' },
  { role: 'client'     as const, label: 'Client',     email: 'client@nexuscrm.ma'     },
];

export function Login({ onLogin, onGoRegister }: LoginProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const found = demoAccounts.find(a => a.email === email.trim().toLowerCase());
      if (found) {
        onLogin(found.role);
      } else if (password === 'demo') {
        onLogin('agent');
      } else {
        setError('Email ou mot de passe incorrect. Utilisez un compte démo ci-dessous.');
      }
    }, 900);
  };

  const quickLogin = (role: typeof demoAccounts[0]['role'], demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo');
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(role); }, 600);
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500 rounded-full opacity-40" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-blue-700 rounded-full opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full opacity-20" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <img src="/images/logonexus.png" className="h-8 w-8 object-contain" alt="Nexus"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div>
            <p className="text-xl font-bold text-white">NexusCRM</p>
            <p className="text-xs text-blue-200">Business Management</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gérez vos relations<br />clients intelligemment
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed mb-10">
            La plateforme CRM tout-en-un pour les équipes modernes. Pilotez vos ventes, votre SAV et vos interventions depuis un seul endroit.
          </p>
          <div className="space-y-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-blue-100">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-xs text-blue-300">© 2026 NexusCRM — Tous droits réservés</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <img src="/images/logonexus.png" className="h-7 w-7 object-contain" alt="Nexus"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <p className="text-lg font-bold text-slate-900">NexusCRM</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Connexion</h2>
            <p className="text-sm text-slate-500 mb-7">Accédez à votre espace de travail</p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@entreprise.ma"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">Mot de passe</label>
                  <button type="button" className="text-xs text-blue-600 hover:underline">Mot de passe oublié ?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer">Se souvenir de moi</label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors mt-2',
                  loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Connexion…
                  </span>
                ) : (
                  <>Se connecter <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-xs text-slate-500 mt-6">
              Pas encore de compte ?{' '}
              <button onClick={onGoRegister} className="text-blue-600 font-semibold hover:underline">
                Créer un compte
              </button>
            </p>

            {/* Demo accounts */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Accès démo rapide</p>
              <div className="flex flex-wrap gap-2">
                {demoAccounts.map(a => (
                  <button
                    key={a.role}
                    onClick={() => quickLogin(a.role, a.email)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
