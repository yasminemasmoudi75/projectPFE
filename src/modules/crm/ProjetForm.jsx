import { useState, useEffect, useMemo } from 'react';
import axios from '../../app/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ArrowLeftIcon, CheckIcon, BriefcaseIcon, CalendarIcon,
    CurrencyDollarIcon, ChartBarIcon, DocumentTextIcon,
    UserIcon, MagnifyingGlassIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { fetchProjetById, createProjet, updateProjet } from './projetSlice';

const normalizeRole = r => String(r || '').trim().toLowerCase();
const isAdminRole   = r => ['admin','administrateur'].includes(normalizeRole(r));
const extractArr    = r => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
const filterLocal   = (list, { q, rep }) => {
    const nq = (q||'').toLowerCase(), nr = String(rep||'');
    return (list||[]).filter(t =>
        (!nq || [t.Raisoc,t.CodTiers,t.Email,t.Tel].filter(Boolean).some(v=>String(v).toLowerCase().includes(nq))) &&
        (!nr  || String(t.codRepresTiers||'')===nr)
    );
};

const pctC = v => v>=50 ? { arc:'#10b981', bar:'bg-emerald-500', text:'text-emerald-600', label:'En bonne voie' }
                : v>=30 ? { arc:'#f59e0b', bar:'bg-amber-400',   text:'text-amber-600',   label:'En progression' }
                :         { arc:'#ef4444', bar:'bg-red-400',     text:'text-red-500',     label:'Critique' };

const Field = ({ label, req, children, hint }) => (
    <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            {label}{req && <span className="text-red-400 ml-0.5">*</span>}
        </p>
        {children}
        {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
);

const inp = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:border-[#0062AF] focus:ring-2 focus:ring-[#0062AF]/10 focus:outline-none transition-all';

const PHASES = ['Nouveau','Analyse','Conception','Exécution','Tests','Clôture'];
const PRIOS  = [
    { v:'Basse',   active:'border-slate-500 bg-slate-50 text-slate-700',    def:'border-slate-200 text-slate-400' },
    { v:'Normale', active:'border-[#0062AF] bg-[#e0f0ff] text-[#0062AF]',   def:'border-slate-200 text-slate-400' },
    { v:'Haute',   active:'border-red-400   bg-red-50    text-red-600',      def:'border-slate-200 text-slate-400' },
];

const ProjetForm = () => {
    const { id }    = useParams();
    const navigate  = useNavigate();
    const dispatch  = useDispatch();
    const isEdit    = Boolean(id);
    const { currentProjet, loading: rl } = useSelector(s => s.projets);
    const { user }  = useSelector(s => s.auth);
    const isAdmin   = isAdminRole(user?.UserRole);

    const [loading, setLoading]   = useState(isEdit);
    const [saving,  setSaving]    = useState(false);
    const [tiers,   setTiers]     = useState([]);
    const [comms,   setComms]     = useState([]);
    const [q,       setQ]         = useState('');
    const [rep,     setRep]       = useState('');
    const [tiersL,  setTiersL]    = useState(false);
    const [snap,    setSnap]      = useState(null);

    const [form, setForm] = useState({
        Nom_Projet:'', IDTiers:'', Budget_Alloue:0, Avancement:0,
        Date_Echeance:'', Priorite:'Normale', Phase:'Nouveau',
        Note_Privee:'', Alerte_IA_Risque:false,
    });

    useEffect(()=>{
        (async()=>{
            try{
                const res  = await axios.get('/users/commercials/activites-filter',{params:{moduleCode:46,includeAll:isAdmin?1:undefined}});
                const rows = extractArr(res).map(r=>({id:String(r.userId||r.UserID||r.value||''),label:r.label||r.fullName||r.FullName||'Commercial'})).filter(r=>r.id);
                setComms(rows);
                if(['commercial','commerciale'].includes(normalizeRole(user?.UserRole))&&user?.UserID) setRep(String(user.UserID));
            }catch{}
        })();
    },[isAdmin,user?.UserID,user?.UserRole]);

    useEffect(()=>{
        const t=setTimeout(async()=>{
            setTiersL(true);
            try{
                const res=await axios.get('/projets/tiers-lookup',{params:{q:q||undefined,codRepres:rep||undefined,limit:80}});
                const d=extractArr(res);
                if(d.length){setTiers(d);return;}
                const fb=await axios.get('/tiers',{params:{page:1,limit:200}});
                setTiers(filterLocal(extractArr(fb),{q,rep}).slice(0,80));
            }catch{}finally{setTiersL(false);}
        },250);
        return()=>clearTimeout(t);
    },[q,rep]);

    const options=useMemo(()=>{
        if(!snap)return tiers;
        const has=tiers.some(t=>String(t.IDTiers||t.CodTiers)===String(snap.IDTiers||snap.CodTiers));
        return has?tiers:[snap,...tiers];
    },[tiers,snap]);

    useEffect(()=>{if(isEdit)dispatch(fetchProjetById(id));},[id,isEdit,dispatch]);
    useEffect(()=>{
        if(isEdit&&currentProjet){
            setForm({
                Nom_Projet:     currentProjet.Nom_Projet||'',
                IDTiers:        currentProjet.IDTiers||'',
                Budget_Alloue:  currentProjet.Budget_Alloue||0,
                Avancement:     currentProjet.Avancement||0,
                Date_Echeance:  currentProjet.Date_Echeance?new Date(currentProjet.Date_Echeance).toISOString().split('T')[0]:'',
                Priorite:       currentProjet.Priorite||'Normale',
                Phase:          currentProjet.Phase||'Nouveau',
                Note_Privee:    currentProjet.Note_Privee||'',
                Alerte_IA_Risque:currentProjet.Alerte_IA_Risque||false,
            });
            setLoading(false);
        }
    },[currentProjet,isEdit]);

    const set=e=>{
        const{name,value,type,checked}=e.target;
        const v=type==='checkbox'?checked:type==='number'?Math.max(0,parseFloat(value)||0):value;
        setForm(p=>({...p,[name]:v}));
    };
    const submit=async e=>{
        e.preventDefault();setSaving(true);
        try{
            const payload={...form,Budget_Alloue:Math.max(0,Number(form.Budget_Alloue||0))};
            if(isEdit){await dispatch(updateProjet({id,data:payload})).unwrap();toast.success('Projet mis à jour');}
            else{await dispatch(createProjet(payload)).unwrap();toast.success('Projet créé');}
            navigate('/projets');
        }catch(err){toast.error(err.message||'Erreur');}finally{setSaving(false);}
    };

    if(loading||(isEdit&&rl))return<LoadingSpinner/>;

    const pct    = Number(form.Avancement)||0;
    const colors = pctC(pct);
    const initials = (form.Nom_Projet||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';

    /* Circle SVG for preview */
    const r=40, circ=2*Math.PI*r, offset=circ*(1-pct/100);

    return (
        <div className="max-w-[1400px] mx-auto pb-16 space-y-5">

            {/* ── Top bar ── */}
            <div className="flex items-center justify-between">
                <button onClick={()=>navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0062AF] transition-colors group">
                    <span className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-[#0062AF]/30 transition-all">
                        <ArrowLeftIcon className="h-4 w-4"/>
                    </span>
                    Retour
                </button>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={()=>navigate('/projets')}
                        className="h-9 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                        Annuler
                    </button>
                    <button onClick={submit} disabled={saving}
                        className="inline-flex items-center gap-1.5 h-9 px-6 bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-bold rounded-lg shadow-sm shadow-[#0062AF]/20 disabled:opacity-60 transition-all">
                        {saving
                            ?<div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            :<CheckIcon className="h-4 w-4"/>}
                        {isEdit?'Enregistrer':'Créer le projet'}
                    </button>
                </div>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* ══ Colonne principale 8/12 ══ */}
                    <div className="lg:col-span-8 space-y-5">

                        {/* ── Hero titre ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400"/>
                            <div className="px-8 py-7">
                                <div className="flex items-center gap-4 mb-6">
                                    {/* Avatar live */}
                                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-md select-none"
                                        style={{background:'linear-gradient(135deg,#0062AF 0%,#003d8c 100%)'}}>
                                        {initials}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                                            {isEdit?'Modifier le projet':'Nouveau projet'}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {form.Nom_Projet||'Saisissez le nom ci-dessous'}
                                        </p>
                                    </div>
                                </div>
                                <input
                                    type="text" name="Nom_Projet"
                                    value={form.Nom_Projet} onChange={set} required
                                    placeholder="Nom du projet…"
                                    className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-200 bg-transparent border-none outline-none pb-2 border-b-2 border-slate-100 focus:border-[#0062AF] transition-colors"/>
                            </div>
                        </div>

                        {/* ── Client ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <UserIcon className="h-4 w-4 text-[#0062AF]"/>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">Client associé</span>
                                </div>
                                {form.IDTiers&&<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Sélectionné ✓</span>}
                            </div>
                            <div className="px-6 py-6 space-y-5">
                                {isAdmin&&!isEdit&&(
                                    <Field label="Commercial">
                                        <select value={rep} onChange={e=>{setRep(e.target.value);setSnap(null);setForm(p=>({...p,IDTiers:''}));}} className={inp+' cursor-pointer'}>
                                            <option value="">Tous les commerciaux</option>
                                            {comms.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                    </Field>
                                )}
                                {!isEdit&&(
                                    <Field label="Rechercher un client">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none"/>
                                            <input type="text" value={q} onChange={e=>setQ(e.target.value)}
                                                placeholder="Nom, code, email…"
                                                className={inp+' pl-11'}/>
                                            {tiersL&&<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Chargement…</span>}
                                        </div>
                                    </Field>
                                )}
                                <Field label="Client" req>
                                    {isEdit?(
                                        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700">
                                            <CheckIcon className="h-4 w-4 flex-shrink-0"/>
                                            Client rattaché — non modifiable
                                        </div>
                                    ):(
                                        <select name="IDTiers" value={form.IDTiers} required
                                            onChange={e=>{
                                                set(e);
                                                const s=options.find(t=>(t.CodTiers||t.IDTiers)===e.target.value);
                                                if(s)setSnap({IDTiers:s.IDTiers,CodTiers:s.CodTiers,Raisoc:s.Raisoc,codRepresTiers:s.codRepresTiers});
                                            }}
                                            className={inp+' cursor-pointer'}>
                                            <option value="">Sélectionner un client…</option>
                                            {options.map(t=>(
                                                <option key={t.IDTiers||t.CodTiers} value={t.CodTiers||t.IDTiers}>
                                                    {(t.Raisoc||t.NomTiers||t.CodTiers)+(t.CodTiers?` (${t.CodTiers})`:'')}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </Field>
                            </div>
                        </div>

                        {/* ── Paramètres ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                                <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                                    <ChartBarIcon className="h-4 w-4 text-violet-600"/>
                                </div>
                                <span className="text-sm font-bold text-slate-800">Paramètres du projet</span>
                            </div>
                            <div className="px-6 py-6 space-y-6">

                                {/* Phase + Échéance + Budget */}
                                <div className="grid grid-cols-3 gap-4">
                                    <Field label="Phase">
                                        <select name="Phase" value={form.Phase} onChange={set} className={inp+' cursor-pointer'}>
                                            {PHASES.map(p=><option key={p}>{p}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Échéance">
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none"/>
                                            <input type="date" name="Date_Echeance" value={form.Date_Echeance} onChange={set} className={inp+' pl-11'}/>
                                        </div>
                                    </Field>
                                    <Field label="Budget (TND)">
                                        <div className="relative">
                                            <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none"/>
                                            <input type="number" min="0" name="Budget_Alloue" value={form.Budget_Alloue} onChange={set}
                                                onKeyDown={e=>e.key==='-'&&e.preventDefault()}
                                                placeholder="0.000" className={inp+' pl-11'}/>
                                        </div>
                                    </Field>
                                </div>

                                {/* Priorité */}
                                <Field label="Priorité">
                                    <div className="grid grid-cols-3 gap-3">
                                        {PRIOS.map(p=>(
                                            <label key={p.v} className={`flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold select-none ${form.Priorite===p.v?p.active:p.def+' hover:border-slate-300'}`}>
                                                <input type="radio" name="Priorite" value={p.v} checked={form.Priorite===p.v} onChange={set} className="hidden"/>
                                                {p.v}
                                            </label>
                                        ))}
                                    </div>
                                </Field>


                                {/* Note privée — intégrée ici aussi */}
                                <Field label="Note interne">
                                    <textarea name="Note_Privee" value={form.Note_Privee} onChange={set}
                                        rows={4} placeholder="Contexte, instructions, détails techniques…"
                                        className={inp+' resize-none'}/>
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* ══ Sidebar 4/12 ══ */}
                    <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-5 self-start">

                        {/* Preview live */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400"/>
                            <div className="px-6 py-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5">Aperçu du projet</p>

                                {/* Cercle SVG */}
                                <div className="flex flex-col items-center gap-4 pb-5 border-b border-slate-100">
                                    <div className="relative h-32 w-32">
                                        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                                            <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8"/>
                                            <circle cx="50" cy="50" r={r} fill="none" stroke={colors.arc}
                                                strokeWidth="8" strokeLinecap="round"
                                                strokeDasharray={circ} strokeDashoffset={offset}
                                                style={{transition:'stroke-dashoffset 0.5s ease-out, stroke 0.4s ease'}}/>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-2xl font-black tabular-nums leading-none ${colors.text}`}>{pct}</span>
                                            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">%</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-base font-bold text-slate-800">{form.Nom_Projet||'—'}</p>
                                        <p className={`text-xs font-semibold mt-0.5 ${colors.text}`}>{colors.label}</p>
                                    </div>
                                </div>

                                {/* Résumé des champs */}
                                <div className="pt-5 space-y-3">
                                    {[
                                        {k:'Phase',    v:form.Phase,                          dot:'bg-[#0062AF]'},
                                        {k:'Priorité', v:form.Priorite,                       dot:form.Priorite==='Haute'?'bg-red-400':form.Priorite==='Normale'?'bg-[#0062AF]':'bg-slate-400'},
                                        {k:'Échéance', v:form.Date_Echeance||'Non définie',   dot:'bg-teal-400'},
                                        {k:'Budget',   v:form.Budget_Alloue>0?`${Number(form.Budget_Alloue).toLocaleString('fr-TN',{minimumFractionDigits:3})} TND`:'—', dot:'bg-violet-400'},
                                    ].map(r=>(
                                        <div key={r.k} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${r.dot}`}/>
                                                <span className="text-xs text-slate-400">{r.k}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 truncate text-right max-w-[120px]">{r.v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProjetForm;
