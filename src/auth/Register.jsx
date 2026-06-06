import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LockClosedIcon, UserIcon, EnvelopeIcon,
  ArrowRightIcon, EyeIcon, EyeSlashIcon,
  ShieldCheckIcon, CheckCircleIcon,
  PhoneIcon, MapPinIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import authService from './authService';

const GOUVERNORATS = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
  'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia',
  'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
  'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

const registerSchema = z.object({
  fullName: z.string().min(3, 'Le nom complet doit avoir au moins 3 caractères'),
  email: z.string().email('Email invalide'),
  telephone: z.string()
    .min(8, 'Numéro invalide')
    .regex(/^[0-9+\s\-()]{8,15}$/, 'Numéro de téléphone invalide'),
  gouvernorat: z.string().min(1, 'Veuillez sélectionner un gouvernorat'),
  password: z.string().min(6, 'Le mot de passe doit avoir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1 text-[11px] text-rose-500 font-semibold">{msg}</p> : null;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.register({
        Password: data.password,
        FullName: data.fullName,
        EmailPro: data.email,
        Telephone: data.telephone,
        Gouvernorat: data.gouvernorat,
        UserRole: 'User',
        DateNaissance: '1990-01-01',
      });
      toast.success('Compte créé avec succès !', {
        style: { borderRadius: '14px', background: '#0062AF', color: '#fff', fontWeight: '700' },
      });
      navigate('/auth/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (hasError) =>
    `w-full h-11 pl-10 pr-4 bg-white border rounded-xl text-sm text-slate-700 placeholder-slate-300 outline-none transition-all focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 ${hasError ? 'border-rose-300' : 'border-slate-200'}`;

  return (
    <div className="animate-fade-in">

      {/* Title */}
      <div className="mb-7">
        <h1 className="text-[32px] font-black leading-tight tracking-tight">
          <span className="text-slate-900">Créer un</span><br />
          <span className="text-[#0062AF]">Accès Personnalisé</span>
        </h1>
        <p className="text-slate-400 text-[13px] font-medium leading-relaxed mt-2.5 max-w-[300px]">
          Configurez votre profil pour rejoindre la plateforme NexusCRM.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
            Nom complet
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-slate-400 pointer-events-none" />
            <input
              {...register('fullName')}
              type="text"
              autoComplete="name"
              placeholder="Prénom Nom"
              className={inputCls(errors.fullName)}
            />
          </div>
          <FieldError msg={errors.fullName?.message} />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
            Email professionnel
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-slate-400 pointer-events-none" />
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="votre.email@bs.tn"
              className={inputCls(errors.email)}
            />
          </div>
          <FieldError msg={errors.email?.message} />
        </div>

        {/* Téléphone + Gouvernorat */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
              Téléphone <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-slate-400 pointer-events-none" />
              <input
                {...register('telephone')}
                type="tel"
                autoComplete="tel"
                placeholder="+216 XX XXX XXX"
                className={inputCls(errors.telephone)}
              />
            </div>
            <FieldError msg={errors.telephone?.message} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
              Gouvernorat <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-slate-400 pointer-events-none z-10" />
              <select
                {...register('gouvernorat')}
                className={`${inputCls(errors.gouvernorat)} appearance-none`}
              >
                <option value="">Sélectionner...</option>
                {GOUVERNORATS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <FieldError msg={errors.gouvernorat?.message} />
          </div>
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-slate-400 pointer-events-none" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputCls(errors.password)}
              />
            </div>
            <FieldError msg={errors.password?.message} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
              Confirmer
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-slate-400 pointer-events-none" />
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${inputCls(errors.confirmPassword)} pr-11`}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none">
                {showPassword ? <EyeSlashIcon className="h-[17px] w-[17px]" /> : <EyeIcon className="h-[17px] w-[17px]" />}
              </button>
            </div>
            <FieldError msg={errors.confirmPassword?.message} />
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#e0f0ff]/60 border border-[#0062AF]/15">
          <CheckCircleIcon className="h-4 w-4 text-[#0062AF] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Votre compte sera examiné par un administrateur avant activation. Vous recevrez une confirmation par email.
          </p>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full h-12 bg-[#0d2048] hover:bg-[#0a1a3a] text-white rounded-xl font-bold text-[13px] uppercase tracking-[0.12em] shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
          {loading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Créer mon compte</span>
              <ArrowRightIcon className="h-4 w-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-7 space-y-4 text-center">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">
            Déjà inscrit ?
          </p>
          <Link to="/auth/login"
            className="text-[12px] font-black text-[#0062AF] uppercase tracking-[0.1em] hover:underline underline-offset-2">
            Ouvrir une session
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white">
          <ShieldCheckIcon className="h-3.5 w-3.5 text-[#0062AF] flex-shrink-0" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
            Protégé par Nexus Security
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
