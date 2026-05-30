import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LockClosedIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { login } from './authSlice';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  EmailPro: z.string().min(1, "L'email est requis").email('Email invalide'),
  Password: z.string().min(1, 'Le mot de passe est requis'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      setPendingApproval(false);
      await dispatch(login({ EmailPro: data.EmailPro, Password: data.Password })).unwrap();
      toast.success('Accès autorisé. Bienvenue !', {
        style: { borderRadius: '14px', background: '#0062AF', color: '#fff', fontWeight: '700' },
      });
      navigate('/dashboard');
    } catch (error) {
      if (error?.includes('attente') || error?.includes('acceptation')) {
        setPendingApproval(true);
      } else {
        toast.error(error || 'Identifiants invalides');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          Connexion
        </h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed">
          Identifiez-vous pour accéder à votre espace NexusCRM.
        </p>
      </div>

      {/* Pending approval alert */}
      {pendingApproval && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800 mb-1">Compte en attente d'activation</h3>
            <p className="text-xs text-amber-700/80 font-medium leading-relaxed">
              Votre demande a été enregistrée. Un administrateur doit valider votre accès avant que vous puissiez vous connecter.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Email */}
        <div>
          <label className="label-modern">Email professionnel</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
            <input
              {...register('EmailPro')}
              type="email"
              autoComplete="email"
              placeholder="votre@email.com"
              className={`input-modern pl-11 ${errors.EmailPro ? 'error' : ''}`}
            />
          </div>
          {errors.EmailPro && (
            <p className="mt-1.5 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-rose-400 inline-block" />
              {errors.EmailPro.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label-modern" style={{ marginBottom: 0 }}>Mot de passe</label>
            <button
              type="button"
              className="text-[11px] font-bold text-[#0062AF] hover:underline focus:outline-none"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
            <input
              {...register('Password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`input-modern pl-11 pr-11 ${errors.Password ? 'error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            >
              {showPassword
                ? <EyeSlashIcon className="h-[18px] w-[18px]" />
                : <EyeIcon className="h-[18px] w-[18px]" />
              }
            </button>
          </div>
          {errors.Password && (
            <p className="mt-1.5 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-rose-400 inline-block" />
              {errors.Password.message}
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2.5">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-[#0062AF] focus:ring-[#0062AF]/30 cursor-pointer"
          />
          <label htmlFor="remember" className="text-xs font-medium text-slate-500 cursor-pointer select-none">
            Se souvenir de moi
          </label>
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
              <span>Ouvrir la session</span>
              <ArrowRightIcon className="h-4 w-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
        <p className="text-center text-sm text-slate-500">
          Nouveau collaborateur ?{' '}
          <Link
            to="/auth/register"
            className="font-bold text-[#0062AF] hover:underline"
          >
            Créer un accès
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-100">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-slate-400">
            Connexion sécurisée — Nexus Security
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
