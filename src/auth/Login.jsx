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

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

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

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-[32px] font-black leading-tight tracking-tight">
          <span className="text-slate-900">Connexion</span><br />
          <span className="text-[#0062AF]">Sécurisée</span>
        </h1>
        <p className="text-slate-400 text-[13px] font-medium leading-relaxed mt-2.5 max-w-[300px]">
          Identifiez-vous pour accéder à votre espace de gestion et vos outils Nexus.
        </p>
      </div>

      {/* Pending approval */}
      {pendingApproval && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-800 mb-0.5">Compte en attente d'activation</h3>
            <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
              Un administrateur doit valider votre accès avant que vous puissiez vous connecter.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
            Email professionnel
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-slate-400 pointer-events-none" />
            <input
              {...register('EmailPro')}
              type="email"
              autoComplete="email"
              placeholder="votre.email@bs.tn"
              className={`w-full h-11 pl-10 pr-4 bg-white border rounded-xl text-sm text-slate-700 placeholder-slate-300 outline-none transition-all focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 ${errors.EmailPro ? 'border-rose-300' : 'border-slate-200'}`}
            />
          </div>
          {errors.EmailPro && (
            <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.EmailPro.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em]">
              Mot de passe
            </label>
            <button type="button"
              className="text-[11px] font-bold text-[#0062AF] uppercase tracking-[0.08em] hover:underline focus:outline-none">
              Oublié ?
            </button>
          </div>
          <div className="relative">
            <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-slate-400 pointer-events-none" />
            <input
              {...register('Password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full h-11 pl-10 pr-11 bg-white border rounded-xl text-sm text-slate-700 placeholder-slate-300 outline-none transition-all focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 ${errors.Password ? 'border-rose-300' : 'border-slate-200'}`}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none">
              {showPassword ? <EyeSlashIcon className="h-[17px] w-[17px]" /> : <EyeIcon className="h-[17px] w-[17px]" />}
            </button>
          </div>
          {errors.Password && (
            <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.Password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2.5">
          <input id="remember" type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-[#0062AF] focus:ring-[#0062AF]/20 cursor-pointer" />
          <label htmlFor="remember"
            className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] cursor-pointer select-none">
            Se souvenir de moi
          </label>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full h-12 bg-[#0d2048] hover:bg-[#0a1a3a] text-white rounded-xl font-bold text-[13px] uppercase tracking-[0.12em] shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
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
      <div className="mt-8 space-y-4 text-center">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">
            Nouveau collaborateur ?
          </p>
          <Link to="/auth/register"
            className="text-[12px] font-black text-[#0062AF] uppercase tracking-[0.1em] hover:underline underline-offset-2">
            Créer un accès personnalisé
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

export default Login;
