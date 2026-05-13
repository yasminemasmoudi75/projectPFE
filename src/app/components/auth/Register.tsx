import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface RegisterProps {
  onRegister: (role: 'admin' | 'agent' | 'technicien' | 'commercial' | 'client') => void;
  onGoLogin: () => void;
}

const roles = [
  { value: 'client'     as const, label: 'Client'      },
  { value: 'agent'      as const, label: 'Agent'       },
  { value: 'commercial' as const, label: 'Commercial'  },
  { value: 'technicien' as const, label: 'Technicien'  },
];

const steps = ['Informations', 'Accès', 'Confirmation'];

export function Register({ onRegister, onGoLogin }: RegisterProps) {
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Fields
  const [prenom, setPrenom]         = useState('');
  const [nom, setNom]               = useState('');
  const [societe, setSociete]       = useState('');
  const [role, setRole]             = useState<typeof roles[0]['value']>('client');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [accepted, setAccepted]     = useState(false);

  const nextStep = () => {
    setError('');
    if (step === 0) {
      if (!prenom || !nom || !societe) { setError('Veuillez remplir tous les champs.'); return; }
    }
    if (step === 1) {
      if (!email || !password || !confirm) { setError('Veuillez remplir tous les champs.'); return; }
      if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
      if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) { setError('Veuillez accepter les conditions d\'utilisation.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); onRegister(role); }, 1000);
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500 rounded-full opacity-40" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-blue-700 rounded-full opacity-50" />

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

        {/* Steps visual */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Créez votre compte<br />en quelques étapes
          </h1>
          <p className="text-blue-100 text-sm mb-10">
            Rejoignez les équipes qui font confiance à NexusCRM pour gérer leurs relations clients.
          </p>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2 transition-all',
                  i < step  ? 'bg-white text-blue-600 border-white'
                  : i === step ? 'bg-blue-500 text-white border-white'
                  : 'bg-transparent text-blue-300 border-blue-400'
                )}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <p className={cn('text-sm font-medium', i <= step ? 'text-white' : 'text-blue-300')}>{s}</p>
              </div>
            ))}
          </div>
        </div>

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

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-300',
                    i <= step ? 'bg-blue-600' : 'bg-slate-200'
                  )} />
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">{steps[step]}</h2>
            <p className="text-sm text-slate-500 mb-6">
              {step === 0 && 'Renseignez vos informations professionnelles'}
              {step === 1 && 'Définissez vos identifiants de connexion'}
              {step === 2 && 'Vérifiez et validez votre inscription'}
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}

            {/* ── Step 0: Informations ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                        placeholder="Prénom"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom</label>
                    <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                      placeholder="Nom"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Société</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={societe} onChange={e => setSociete(e.target.value)}
                      placeholder="Nom de votre entreprise"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rôle</label>
                  <select value={role} onChange={e => setRole(e.target.value as typeof role)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white">
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* ── Step 1: Accès ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Adresse email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="vous@entreprise.ma"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  <div className="flex gap-1 mt-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', password.length >= i * 2 ? (password.length >= 8 ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-200')} />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Minimum 6 caractères</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showConf ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={cn('w-full pl-9 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400',
                        confirm && confirm !== password ? 'border-red-300' : 'border-slate-200')} />
                    <button type="button" onClick={() => setShowConf(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 2: Confirmation ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                  {[
                    { label: 'Nom complet', value: `${prenom} ${nom}` },
                    { label: 'Société',     value: societe             },
                    { label: 'Rôle',        value: roles.find(r => r.value === role)?.label || role },
                    { label: 'Email',       value: email              },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-1 border-b border-slate-200 last:border-0">
                      <span className="text-xs text-slate-500">{row.label}</span>
                      <span className="text-xs font-semibold text-slate-800">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2.5">
                  <input type="checkbox" id="accept" checked={accepted} onChange={e => setAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer flex-shrink-0" />
                  <label htmlFor="accept" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
                    J'accepte les{' '}
                    <span className="text-blue-600 font-medium">conditions d'utilisation</span>
                    {' '}et la{' '}
                    <span className="text-blue-600 font-medium">politique de confidentialité</span>
                    {' '}de NexusCRM.
                  </label>
                </div>

                <button type="submit" disabled={loading || !accepted}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors',
                    loading || !accepted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Création du compte…
                    </span>
                  ) : (
                    <>Créer mon compte <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* Navigation buttons (steps 0 & 1) */}
            {step < 2 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={step === 0 ? onGoLogin : () => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {step === 0 ? 'Retour à la connexion' : 'Précédent'}
                </button>
                <button onClick={nextStep}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                  Suivant <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <p className="text-center text-xs text-slate-500 mt-4">
                <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mx-auto">
                  <ArrowLeft className="w-3 h-3" /> Modifier
                </button>
              </p>
            )}

            {/* Login link */}
            <p className="text-center text-xs text-slate-500 mt-5">
              Déjà un compte ?{' '}
              <button onClick={onGoLogin} className="text-blue-600 font-semibold hover:underline">
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
