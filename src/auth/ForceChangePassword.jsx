import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import api from '@app/axios';
import toast from 'react-hot-toast';
import { passwordChanged, logout } from './authSlice';

const PasswordInput = ({ label, value, onChange, show, onToggle, placeholder }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-[#0062AF]/10 transition-all"
      />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

const rules = [
  { label: '8 caractères minimum', test: (p) => p.length >= 8 },
  { label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
  { label: 'Une minuscule', test: (p) => /[a-z]/.test(p) },
  { label: 'Un chiffre', test: (p) => /\d/.test(p) },
  { label: 'Un caractère spécial (@$!%*?&)', test: (p) => /[@$!%*?&]/.test(p) },
];

const ForceChangePassword = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.current || !form.next || !form.confirm) {
      toast.error('Tous les champs sont requis');
      return;
    }
    if (form.next !== form.confirm) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    const allRulesPassed = rules.every((r) => r.test(form.next));
    if (!allRulesPassed) {
      toast.error('Le mot de passe ne respecte pas les règles de sécurité');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.current,
        newPassword: form.next,
        confirmPassword: form.confirm,
      });
      dispatch(passwordChanged());
      toast.success('Mot de passe modifié — bienvenue !');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0062AF] to-sky-500 px-6 py-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-white">Changement de mot de passe requis</h1>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            Pour votre sécurité, vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <PasswordInput
            label="Mot de passe actuel (reçu par email)"
            value={form.current}
            onChange={set('current')}
            show={show.current}
            onToggle={() => toggle('current')}
            placeholder="Votre mot de passe temporaire"
          />
          <PasswordInput
            label="Nouveau mot de passe"
            value={form.next}
            onChange={set('next')}
            show={show.next}
            onToggle={() => toggle('next')}
            placeholder="Choisissez un mot de passe fort"
          />
          <PasswordInput
            label="Confirmer le nouveau mot de passe"
            value={form.confirm}
            onChange={set('confirm')}
            show={show.confirm}
            onToggle={() => toggle('confirm')}
            placeholder="Répétez le nouveau mot de passe"
          />

          {/* Indicateurs de règles */}
          {form.next && (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {rules.map((r) => (
                <div key={r.label} className={`flex items-center gap-1.5 text-[11px] font-medium ${r.test(form.next) ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <ShieldCheckIcon className={`h-3.5 w-3.5 flex-shrink-0 ${r.test(form.next) ? 'text-emerald-500' : 'text-slate-300'}`} />
                  {r.label}
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full mt-2 py-3 bg-[#0062AF] hover:bg-[#004a85] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-blue-500/20">
            {saving ? 'Enregistrement…' : 'Confirmer et accéder à l\'application'}
          </button>

          <button type="button" onClick={() => dispatch(logout())}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePassword;
