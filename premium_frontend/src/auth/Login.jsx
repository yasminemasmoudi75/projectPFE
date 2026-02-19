import { useState } from 'react';
import { useDispatch } from 'react-redux';
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
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { login } from './authSlice';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  EmailPro: z.string().min(1, 'L\'email est requis').email('Email invalide'),
  Password: z.string().min(1, 'Le mot de passe est requis'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await dispatch(login({
        EmailPro: data.EmailPro,
        Password: data.Password
      })).unwrap();
      toast.success('Accès autorisé. Bienvenue !', {
        style: {
          borderRadius: '16px',
          background: '#0062AF',
          color: '#fff',
          fontWeight: '700',
        },
      });
      navigate('/dashboard');
    } catch (error) {
      toast.error(error || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in relative z-10 px-4 md:px-0">
      {/* Reduced Header since logos are in the Layout */}
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">
          Connexion <br />
          <span className="text-[#0062AF]">Sécurisée</span>
        </h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] md:max-w-none">
          Identifiez-vous pour accéder à votre espace de gestion et vos outils Nexus.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div className="group">
          <label className="label-modern italic tracking-[0.2em] mb-2 px-1 text-[10px]">Email professionnel</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#0062AF] transition-colors" />
            </div>
            <input
              {...register('EmailPro')}
              type="email"
              className="input-modern pl-11 h-14 font-bold border-slate-200 focus:border-[#0062AF] focus:ring-blue-100"
              placeholder="votre.email@bs.tn"
            />
          </div>
          {errors.EmailPro && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-widest">{errors.EmailPro.message}</p>}
        </div>

        {/* Password Field */}
        <div className="group">
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="label-modern italic tracking-[0.2em] text-[10px]">Mot de passe</label>
            <button type="button" className="text-[9px] font-black text-[#0062AF] uppercase tracking-widest hover:underline">Oublié ?</button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#0062AF] transition-colors" />
            </div>
            <input
              {...register('Password')}
              type={showPassword ? 'text' : 'password'}
              className="input-modern pl-11 h-14 font-bold border-slate-200 focus:border-[#0062AF] focus:ring-blue-100"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-[#0062AF] transition-colors"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {errors.Password && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-widest">{errors.Password.message}</p>}
        </div>

        {/* Options */}
        <div className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            id="remember"
            className="h-5 w-5 rounded-lg border-slate-200 text-[#0062AF] focus:ring-[#0062AF] focus:ring-offset-0 transition-all cursor-pointer"
          />
          <label htmlFor="remember" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer">Se souvenir de moi</label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-gradient-to-r from-[#0062AF] to-[#004a85] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Ouvrir la session</span>
              <ArrowRightIcon className="h-5 w-5 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">
          Nouveau collaborateur ? <br />
          <Link to="/auth/register" className="text-[#0062AF] hover:underline font-black">
            Créer un accès personnalisé
          </Link>
        </p>

        <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-soft">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter italic">Protégé par Nexus Security</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
