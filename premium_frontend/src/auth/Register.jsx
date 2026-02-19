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
    IdentificationIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import authService from './authService';

const registerSchema = z.object({
    fullName: z.string().min(3, 'Le nom complet doit avoir au moins 3 caractères'),
    email: z.string().email('Email invalide'),
    loginName: z.string().min(4, 'L\'identifiant doit avoir au moins 4 caractères'),
    password: z.string().min(6, 'Le mot de passe de base est requis'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await authService.register({
                LoginName: data.loginName,
                Password: data.password,
                FullName: data.fullName,
                EmailPro: data.email,
                UserRole: 'User',
                DateNaissance: '1990-01-01' // Default for now
            });

            toast.success('Compte créé avec succès ! Connectez-vous.', {
                style: {
                    borderRadius: '16px',
                    background: '#0062AF',
                    color: '#fff',
                    fontWeight: '700',
                },
            });
            navigate('/auth/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in relative z-10 px-4 md:px-0">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">
                    Inscription <br />
                    <span className="text-[#0062AF]">Collaborateur</span>
                </h1>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed">
                    Configurez votre profil pour accéder à la plateforme Nexus.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div className="group">
                    <label className="label-modern italic tracking-[0.2em] mb-2 px-1 text-[10px]">Nom & Prénom</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#0062AF] transition-colors" />
                        </div>
                        <input
                            {...register('fullName')}
                            type="text"
                            className="input-modern pl-11 h-12 font-bold border-slate-200 focus:border-[#0062AF]"
                            placeholder="Ex: Ahmed Ben Salem"
                        />
                    </div>
                    {errors.fullName && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase tracking-widest">{errors.fullName.message}</p>}
                </div>

                {/* Email */}
                <div className="group">
                    <label className="label-modern italic tracking-[0.2em] mb-2 px-1 text-[10px]">Email Pro</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#0062AF] transition-colors" />
                        </div>
                        <input
                            {...register('email')}
                            type="email"
                            className="input-modern pl-11 h-12 font-bold border-slate-200 focus:border-[#0062AF]"
                            placeholder="a.bensalem@bs.tn"
                        />
                    </div>
                    {errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase tracking-widest">{errors.email.message}</p>}
                </div>

                {/* Login Name */}
                <div className="group">
                    <label className="label-modern italic tracking-[0.2em] mb-2 px-1 text-[10px]">Identifiant Login</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <IdentificationIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#0062AF] transition-colors" />
                        </div>
                        <input
                            {...register('loginName')}
                            type="text"
                            className="input-modern pl-11 h-12 font-mono font-bold border-slate-200 focus:border-[#0062AF]"
                            placeholder="votre_login"
                        />
                    </div>
                    {errors.loginName && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase tracking-widest">{errors.loginName.message}</p>}
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                        <label className="label-modern italic tracking-[0.2em] mb-2 px-1 text-[10px]">Mot de Passe</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#0062AF] transition-colors" />
                            </div>
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                className="input-modern pl-11 h-12 border-slate-200 focus:border-[#0062AF]"
                                placeholder="••••••"
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label className="label-modern italic tracking-[0.2em] mb-2 px-1 text-[10px]">Confirmation</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#0062AF] transition-colors" />
                            </div>
                            <input
                                {...register('confirmPassword')}
                                type={showPassword ? 'text' : 'password'}
                                className="input-modern pl-11 h-12 border-slate-200 focus:border-[#0062AF]"
                                placeholder="••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-[#0062AF] transition-colors"
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-4 bg-gradient-to-r from-[#0062AF] to-[#004a85] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>Créer l'accès</span>
                            <ArrowRightIcon className="h-5 w-5 stroke-[2.5]" />
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                    Déjà inscrit ?{' '}
                    <Link to="/auth/login" className="text-[#0062AF] hover:underline font-black">
                        Se connecter
                    </Link>
                </p>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <ShieldCheckIcon className="h-3 w-3 text-emerald-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">Sécurité Nexus v1.2</span>
                </div>
            </div>
        </div>
    );
};

export default Register;
