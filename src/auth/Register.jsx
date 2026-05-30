import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LockClosedIcon,
  UserIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import authService from './authService';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Le nom complet doit avoir au moins 3 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit avoir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

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

  const FieldError = ({ msg }) =>
    msg ? (
      <p className="mt-1.5 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-rose-400 inline-block" />
        {msg}
      </p>
    ) : null;

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          Créer un compte
        </h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed">
          Configurez votre profil pour accéder à la plateforme NexusCRM.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Full Name */}
        <div>
          <label className="label-modern">Nom complet</label>
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
            <input
              {...register('fullName')}
              type="text"
              autoComplete="name"
              placeholder="Prénom Nom"
              className={`input-modern pl-11 ${errors.fullName ? 'error' : ''}`}
            />
          </div>
          <FieldError msg={errors.fullName?.message} />
        </div>

        {/* Email */}
        <div>
          <label className="label-modern">Email professionnel</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="votre@email.com"
              className={`input-modern pl-11 ${errors.email ? 'error' : ''}`}
            />
          </div>
          <FieldError msg={errors.email?.message} />
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label-modern">Mot de passe</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`input-modern pl-11 ${errors.password ? 'error' : ''}`}
              />
            </div>
            <FieldError msg={errors.password?.message} />
          </div>

          <div>
            <label className="label-modern">Confirmer</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`input-modern pl-11 pr-11 ${errors.confirmPassword ? 'error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeSlashIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
              </button>
            </div>
            <FieldError msg={errors.confirmPassword?.message} />
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
          <CheckCircleIcon className="h-4 w-4 text-[#0062AF] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Votre compte sera examiné par un administrateur avant activation. Vous recevrez une confirmation par email.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-[#0062AF] to-[#004a85] hover:from-[#004a85] hover:to-[#003370] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
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
      <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
        <p className="text-center text-sm text-slate-500">
          Déjà inscrit ?{' '}
          <Link to="/auth/login" className="font-bold text-[#0062AF] hover:underline">
            Se connecter
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-100">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-slate-400">
            Données sécurisées — Nexus Security
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
