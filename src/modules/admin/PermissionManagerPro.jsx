import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import {
  KeyIcon, CheckIcon, ShieldCheckIcon,
  ArrowPathIcon, MagnifyingGlassIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/* modules exclus de l'interface (codes API) */
const EXCLUDED_CODES = new Set([40, 41, 43, 44, 45, 47, 52]);

/* colonnes permission affichées */
const PERMS = [
  { key: 'isActive',  label: 'Accès'     },
  { key: 'canAdd',    label: 'Créer'     },
  { key: 'canEdit',   label: 'Modifier'  },
  { key: 'canDelete', label: 'Supprimer' },
];

const PALETTE = [
  'bg-sky-500 text-white border-sky-500',
  'bg-violet-500 text-white border-violet-500',
  'bg-emerald-500 text-white border-emerald-500',
  'bg-amber-500 text-white border-amber-500',
  'bg-rose-500 text-white border-rose-500',
  'bg-teal-500 text-white border-teal-500',
];
const PALETTE_IDLE = [
  'text-sky-700 border-sky-300 hover:bg-sky-50',
  'text-violet-700 border-violet-300 hover:bg-violet-50',
  'text-emerald-700 border-emerald-300 hover:bg-emerald-50',
  'text-amber-700 border-amber-300 hover:bg-amber-50',
  'text-rose-700 border-rose-300 hover:bg-rose-50',
  'text-teal-700 border-teal-300 hover:bg-teal-50',
];

/* ── Checkbox ── */
const Cell = ({ checked, onChange }) => (
  <td className="px-3 py-2.5 text-center">
    <button onClick={onChange}
      className={`h-5 w-5 mx-auto rounded flex items-center justify-center border transition-all ${
        checked ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 hover:border-indigo-400'
      }`}>
      {checked && <CheckIcon className="h-3 w-3 text-white stroke-[3]" />}
    </button>
  </td>
);

/* normalise une valeur 0/1/true/false → boolean */
const bool = v => v === 1 || v === true;

const PermissionManagerPro = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();

  const [roles, setRoles]         = useState([]);
  const [modules, setModules]     = useState([]);
  const [perms, setPerms]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [role, setRole]           = useState('');
  const [search, setSearch]       = useState('');
  const [pending, setPending]     = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) { toast.error('Accès réservé aux administrateurs'); navigate('/dashboard'); return; }
    load();
  }, [isAdmin, authLoading, navigate]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/permissions/all');

      // Accepter les deux structures possibles
      const payload = res.data?.data ?? res.data ?? {};
      const rows    = payload.permissions ?? (Array.isArray(payload) ? payload : []);

      console.log('[Permissions] rows reçus:', rows.length, rows[0]);

      if (rows.length === 0) {
        setError('Aucune donnée reçue depuis TabAWProfileAccess.');
        return;
      }

      /* ── Rôles depuis DB (excl. Admin) ── */
      const dbRoles = [...new Set(
        rows.map(r => r.role ?? r.ProfileUser ?? '').filter(v => v && v.toLowerCase() !== 'admin')
      )].sort();

      /* ── Modules depuis DB ── */
      const modMap = {};
      rows.forEach(r => {
        const code = Number(r.moduleCode ?? r.CodMod ?? 0);
        if (!code) return;
        modMap[code] = r.moduleName ?? r.LibMod ?? `Module ${code}`;
      });
      const dbModules = Object.entries(modMap)
        .map(([c, n]) => ({ code: Number(c), name: n }))
        .filter(m => !EXCLUDED_CODES.has(m.code))
        .sort((a, b) => a.code - b.code);

      /* ── Build permissions matrix ── */
      const base = {};
      dbRoles.forEach(rl => {
        base[rl] = {};
        dbModules.forEach(m => {
          base[rl][m.code] = { isActive: false, canAdd: false, canEdit: false, canDelete: false, canValid: false, canExport: false };
        });
      });
      rows.forEach(r => {
        const rl   = r.role ?? r.ProfileUser;
        const code = Number(r.moduleCode ?? r.CodMod ?? 0);
        if (!rl || !code || !base[rl] || base[rl][code] === undefined) return;
        base[rl][code] = {
          isActive:  bool(r.isActive) || bool(r.Actif),
          canAdd:    bool(r.canAdd),
          canEdit:   bool(r.canEdit),
          canDelete: bool(r.canDelt)  || bool(r.canDelete),
          canValid:  bool(r.canValid),
          canExport: bool(r.CanImp)   || bool(r.canExport),
        };
      });

      setRoles(dbRoles);
      setModules(dbModules);
      setPerms(base);
      setRole(prev => dbRoles.includes(prev) ? prev : dbRoles[0] ?? '');
      setPending([]);
      setHasChanges(false);
    } catch (err) {
      console.error('[Permissions] erreur:', err);
      setError(err?.response?.data?.message || 'Erreur de chargement des permissions.');
      toast.error('Erreur lors du chargement des permissions');
    } finally {
      setLoading(false);
    }
  };

  /* toggle une cellule */
  const toggle = (code, field) => {
    const newVal = !perms[role][code][field];
    setPerms(prev => ({
      ...prev,
      [role]: { ...prev[role], [code]: { ...prev[role][code], [field]: newVal } },
    }));
    setPending(prev => {
      const idx = prev.findIndex(c => c.role === role && c.moduleCode === code);
      return idx >= 0
        ? prev.map((c, i) => i === idx ? { ...c, [field]: newVal } : c)
        : [...prev, { role, moduleCode: code, ...perms[role][code], [field]: newVal }];
    });
    setHasChanges(true);
  };

  /* tout cocher/décocher sur une ligne */
  const toggleRow = (code) => {
    const cur    = perms[role][code];
    const allOn  = PERMS.every(p => cur[p.key]);
    const toggled = Object.fromEntries(PERMS.map(p => [p.key, !allOn]));
    const next   = { ...cur, ...toggled }; // preserve canValid, canExport, etc.
    setPerms(prev => ({ ...prev, [role]: { ...prev[role], [code]: next } }));
    setPending(prev => {
      const idx = prev.findIndex(c => c.role === role && c.moduleCode === code);
      return idx >= 0
        ? prev.map((c, i) => i === idx ? { ...c, ...toggled } : c)
        : [...prev, { role, moduleCode: code, ...next }];
    });
    setHasChanges(true);
  };

  /* tout cocher/décocher sur une colonne */
  const toggleCol = (field) => {
    const vis   = filtered;
    const allOn = vis.every(m => perms[role][m.code]?.[field]);
    setPerms(prev => {
      const updated = { ...prev[role] };
      vis.forEach(m => { updated[m.code] = { ...updated[m.code], [field]: !allOn }; });
      return { ...prev, [role]: updated };
    });
    setPending(prev => {
      const next = [...prev];
      vis.forEach(m => {
        const idx = next.findIndex(c => c.role === role && c.moduleCode === m.code);
        if (idx >= 0) next[idx] = { ...next[idx], [field]: !allOn };
        else next.push({ role, moduleCode: m.code, ...perms[role][m.code], [field]: !allOn });
      });
      return next;
    });
    setHasChanges(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(pending.map(c => axios.put('/permissions/update', c)));
      toast.success('Permissions sauvegardées !');
      setHasChanges(false);
      setPending([]);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const filtered = modules.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  if (authLoading || loading) return (
    <div className="flex items-center justify-center h-80">
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-80 gap-4">
      <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
        <KeyIcon className="h-7 w-7 text-rose-400" />
      </div>
      <p className="text-sm font-semibold text-rose-600">{error}</p>
      <button onClick={load} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all">
        <ArrowPathIcon className="h-4 w-4" /> Réessayer
      </button>
    </div>
  );

  if (roles.length === 0) return (
    <div className="flex flex-col items-center justify-center h-80 gap-3">
      <p className="text-sm text-slate-400">Aucun rôle trouvé dans TabAWProfileAccess.</p>
      <button onClick={load} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all">
        <ArrowPathIcon className="h-4 w-4" /> Actualiser
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
              <KeyIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">Rôles &amp; Permissions</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {modules.length} modules · {roles.length} rôles · données en temps réel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all">
              <ArrowPathIcon className="h-4 w-4" /> Actualiser
            </button>
            {hasChanges && (
              <button onClick={save} disabled={saving}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-bold transition-all shadow-sm disabled:opacity-60">
                {saving
                  ? <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Sauvegarde…</>
                  : <><CheckCircleIcon className="h-4 w-4" />Enregistrer ({pending.length})</>}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── Sélecteur rôle + recherche ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {roles.map((r, idx) => (
              <button key={r} onClick={() => setRole(r)}
                className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-bold transition-all ${
                  role === r ? PALETTE[idx % PALETTE.length] : `bg-white ${PALETTE_IDLE[idx % PALETTE_IDLE.length]}`
                }`}>
                <ShieldCheckIcon className="h-4 w-4" />
                {r}
              </button>
            ))}
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filtrer un module…"
              className="h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 w-56 transition-all" />
          </div>
        </div>

        {/* ── Table unique ── */}
        {role && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Permissions — {role}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                {filtered.length} modules
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider w-12">
                      Tout
                    </th>
                    {PERMS.map(p => (
                      <th key={p.key} className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <button onClick={() => toggleCol(p.key)} title="Cocher / décocher toute la colonne"
                          className="hover:text-indigo-500 transition-colors whitespace-nowrap">
                          {p.label}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={PERMS.length + 2} className="px-5 py-10 text-center text-xs text-slate-400">
                        Aucun module trouvé
                      </td>
                    </tr>
                  ) : filtered.map(mod => {
                    const row   = perms[role]?.[mod.code] || {};
                    const allOn = PERMS.every(p => row[p.key]);
                    return (
                      <tr key={mod.code} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-300 w-7 text-right flex-none">{mod.code}</span>
                            <span className="text-xs font-semibold text-slate-700">{mod.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button onClick={() => toggleRow(mod.code)}
                            className={`h-5 w-5 mx-auto rounded-full flex items-center justify-center border transition-all ${
                              allOn ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 hover:border-indigo-400'
                            }`}>
                            {allOn && <CheckIcon className="h-3 w-3 text-white stroke-[3]" />}
                          </button>
                        </td>
                        {PERMS.map(p => (
                          <Cell key={p.key} checked={!!row[p.key]} onChange={() => toggle(mod.code, p.key)} />
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PermissionManagerPro;
