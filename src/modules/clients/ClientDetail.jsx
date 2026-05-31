import { useState, useEffect, useMemo } from 'react';
import axios from '../../app/axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowLeftIcon,
    UserCircleIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    IdentificationIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    ChartBarIcon,
    ClockIcon,
    CalendarIcon,
    ArrowRightIcon,
    SparklesIcon,
    ArrowPathIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    ArrowUpRightIcon,
    ChevronDownIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency, getWhatsAppLink } from '../../utils/format';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [activeTab, setActiveTab] = useState('infos');
    const [clientActivities, setClientActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [activitiesError, setActivitiesError] = useState(null);
    const [clientProjets, setClientProjets] = useState([]);
    const [loadingProjets, setLoadingProjets] = useState(false);
    const [projetsError, setProjetsError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        identity: true,
        contact: true,
        financial: false,
        tax: false,
        status: false,
        location: false,
    });
    const [clientDevis, setClientDevis] = useState([]);
    const [loadingDevis, setLoadingDevis] = useState(false);
    const [satisfaction, setSatisfaction] = useState(null);
    const [loadingSatisfaction, setLoadingSatisfaction] = useState(false);
    const [clientInvoices, setClientInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    useEffect(() => {
        const fetchClientDetails = async () => {
            try {
                const response = await axios.get(`/tiers/${id}`);
                const payload = response.data;
                const realData = payload?.data || payload;
                if (!realData) { setClient(null); return; }
                setClient({
                    ...realData,
                    LibTiers: realData.Raisoc,
                    Type: 'Client Professionnel',
                    CodePostal: realData.Cp || '',
                    MatriculeFiscale: realData.CodTva || '',
                    Commercial: realData.codRepresTiers || '',
                    Solde: 0,
                    ChiffreAffairesTotal: 0,
                    NombreDevis: 0,
                    NombreProjets: 0,
                    DateCreation: realData.DateCreatUser || new Date(),
                    ActivitesRecentes: [],
                    DevisRecents: []
                });
            } catch (error) {
                console.error('Error fetching client details:', error);
                setClient(null);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchClientDetails();
    }, [id]);

    useEffect(() => {
        const fetchClientActivities = async () => {
            if (!client?.IDTiers) return;
            setLoadingActivities(true);
            setActivitiesError(null);
            try {
                const response = await axios.get('/activites', { params: { tierId: client.IDTiers } });
                const data = response.data?.data || response.data || [];
                setClientActivities(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching client activities:', error);
                setActivitiesError("Impossible de charger les activités du client");
            } finally {
                setLoadingActivities(false);
            }
        };
        fetchClientActivities();
    }, [client?.IDTiers]);

    useEffect(() => {
        const fetchClientProjets = async () => {
            if (!client?.IDTiers) return;
            setLoadingProjets(true);
            setProjetsError(null);
            try {
                const response = await axios.get('/projets', { params: { page: 1, limit: 100 } });
                const rows = response.data?.data || response.data || [];
                const projetsForClient = Array.isArray(rows)
                    ? rows.filter(p => p.IDTiers === client.IDTiers || p.client?.IDTiers === client.IDTiers)
                    : [];
                setClientProjets(projetsForClient);
            } catch (error) {
                console.error('Error fetching client projets:', error);
                setProjetsError("Impossible de charger les projets du client");
            } finally {
                setLoadingProjets(false);
            }
        };
        fetchClientProjets();
    }, [client?.IDTiers]);

    useEffect(() => {
        const fetchClientDevis = async () => {
            if (!client?.CodTiers) return;
            setLoadingDevis(true);
            try {
                const response = await axios.get('/devis', { params: { codTiers: client.CodTiers, limit: 50 } });
                const data = response.data?.data || response.data || [];
                setClientDevis(Array.isArray(data) ? data : []);
            } catch {
                setClientDevis([]);
            } finally {
                setLoadingDevis(false);
            }
        };
        fetchClientDevis();
    }, [client?.CodTiers]);

    useEffect(() => {
        const fetchSatisfaction = async () => {
            if (!client?.CodTiers) return;
            setLoadingSatisfaction(true);
            try {
                const result = await axios.get(`/ia/satisfaction/${client.CodTiers}`);
                setSatisfaction(result?.data);
            } catch (error) {
                console.error('Error fetching satisfaction:', error);
            } finally {
                setLoadingSatisfaction(false);
            }
        };
        fetchSatisfaction();
    }, [client?.CodTiers]);

    useEffect(() => {
        const fetchClientInvoices = async () => {
            if (!client?.CodTiers) return;
            setLoadingInvoices(true);
            try {
                const response = await axios.get('/fav', { params: { search: client.CodTiers, limit: 500 } });
                const list = response?.data?.data || response?.data || [];
                const code = String(client.CodTiers).trim();
                const name = String(client.Raisoc || '').trim().toLowerCase();
                setClientInvoices(
                    (Array.isArray(list) ? list : []).filter(inv =>
                        String(inv.CodTiers || '').trim() === code ||
                        String(inv.LibTiers || '').trim().toLowerCase() === name
                    )
                );
            } catch {
                setClientInvoices([]);
            } finally {
                setLoadingInvoices(false);
            }
        };
        fetchClientInvoices();
    }, [client?.CodTiers, client?.Raisoc]);

    const financialTotals = useMemo(() => {
        const totalFacture = clientInvoices.reduce((a, i) => a + Number(i.TotTTC    || 0), 0);
        const totalPaye    = clientInvoices.reduce((a, i) => a + Number(i.MntCredit || 0), 0);
        const totalDu      = Math.max(totalFacture - totalPaye, 0);
        const taux         = totalFacture > 0 ? Math.min((totalPaye / totalFacture) * 100, 100) : 0;
        return { totalFacture, totalPaye, totalDu, taux };
    }, [clientInvoices]);

    if (loading) return <LoadingSpinner />;
    if (!client) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <UserCircleIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">Client non trouvé</p>
            <button onClick={() => navigate('/clients')} className="btn btn-primary btn-sm">Retour à la liste</button>
        </div>
    );

    const contacts = Array.isArray(client.contacts) ? client.contacts : [];
    const addresses = Array.isArray(client.addresses) ? client.addresses : [];

    const displayName = client.Raisoc || client.LibTiers || '';
    const initials = displayName.trim()
        ? displayName.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : (client.CodTiers || '?')[0].toUpperCase();

    const formatFieldValue = (value) => {
        if (value === null || value === undefined || value === '') return '—';
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        return String(value);
    };

    const renderWhatsAppField = (value, className = '') => {
        const link = getWhatsAppLink(value);
        if (!link) return <span className={className}>{formatFieldValue(value)}</span>;
        return (
            <a href={link} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`${className} hover:text-emerald-600 hover:underline flex items-center gap-1.5 transition-all`}>
                {value}
                <svg className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>
        );
    };

    const infoSections = [
        {
            id: 'identity',
            title: 'Identité',
            icon: IdentificationIcon,
            color: 'blue',
            fields: [
                ['Raison sociale', client.Raisoc],
                ['Prénom', client.Prenom],
                ['Nom', client.Nom],
                ['CIN', client.Cin],
                ['Classe', client.tiersClasse?.libelle],
                ['Catégorie', client.tiersCategorieObj?.libelle || client.Categorie],
            ]
        },
        {
            id: 'location',
            title: 'Adresse',
            icon: MapPinIcon,
            color: 'rose',
            fields: [
                ['Adresse', client.Adresse],
                ['Ville', client.Ville],
                ['Code postal', client.Cp || client.CodePostal],
                ['Gouvernorat', client.region?.libelle || client.tiersGouvernorat?.libelle],
                ['Pays', client.Pays],
            ]
        },
        {
            id: 'contact',
            title: 'Contacts',
            icon: PhoneIcon,
            color: 'emerald',
            fields: [
                ['Email', client.Email],
                ['Téléphone', client.Tel],
                ['Mobile', client.Gsm],
                ['Fax', client.Fax],
                ['Site web', client.www],
            ]
        },
        {
            id: 'financial',
            title: 'Financier',
            icon: DocumentTextIcon,
            color: 'amber',
            fields: [
                ['Matricule fiscale', client.CodTva || client.MatriculeFiscale],
                ['Banque', client.Banque],
                ['Remise (%)', client.Remise],
                ['Plafond crédit', client.Plafondcredit],
                ['Conditions paiement', client.ConditionPaiement],
                ['Commercial', client.codRepresTiers || client.Commercial],
            ]
        },
        {
            id: 'status',
            title: 'Statuts',
            icon: SparklesIcon,
            color: 'violet',
            fields: [
                ['Actif', client.Actif],
                ['Bloqué', client.Blockage],
                ['Timbre', client.Timbre],
                ['Majoration', client.Major],
                ['Exonéré', client.Exonor],
                ['Assujetti', client.assujet],
                ['Fictif', client.Fictif],
                ['Pub', client.Pub],
            ]
        },
    ];

    const sectionColorMap = {
        blue:   { header: 'bg-blue-50 border-blue-200',   icon: 'bg-[#0062AF] text-white',  title: 'text-[#0062AF]',   badge: 'bg-blue-100 text-blue-700' },
        rose:   { header: 'bg-rose-50 border-rose-200',   icon: 'bg-rose-500 text-white',    title: 'text-rose-700',    badge: 'bg-rose-100 text-rose-700' },
        emerald:{ header: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-500 text-white', title: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
        amber:  { header: 'bg-amber-50 border-amber-200', icon: 'bg-amber-500 text-white',   title: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
        violet: { header: 'bg-violet-50 border-violet-200',icon: 'bg-violet-500 text-white', title: 'text-violet-700',  badge: 'bg-violet-100 text-violet-700' },
    };

    const TABS = [
        { id: 'infos',      label: 'Informations', icon: IdentificationIcon },
        { id: 'activities', label: 'Activités',     icon: ClockIcon          },
        { id: 'devis',      label: 'Devis',         icon: DocumentTextIcon   },
        { id: 'projets',    label: 'Projets',       icon: BriefcaseIcon      },
        { id: 'ia',         label: 'Analyse IA',    icon: SparklesIcon       },
        { id: 'reglements', label: 'Règlements',    icon: BanknotesIcon      },
    ];

    return (
        <div className="min-h-screen bg-slate-50/80 pb-16">

            {/* ── Top nav bar ── */}
            <div className="max-w-7xl mx-auto px-6 pt-5 pb-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/clients')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0062AF] transition-colors group"
                >
                    <span className="h-8 w-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-[#0062AF]/30 group-hover:bg-[#e0f0ff] transition-all">
                        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    </span>
                    Retour aux clients
                </button>
                <div className="flex items-center gap-2">
                    {client.Email && (
                        <a
                            href={`mailto:${client.Email}`}
                            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <EnvelopeIcon className="h-4 w-4" /> Email
                        </a>
                    )}
                    <button
                        onClick={() => navigate(`/clients/edit/${id}`)}
                        className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        <PencilIcon className="h-4 w-4" /> Modifier
                    </button>
                    <button
                        onClick={() => navigate('/devis/new', { state: { defaultCodTiers: client.CodTiers } })}
                        className="inline-flex items-center gap-1.5 h-9 px-5 text-sm font-bold text-white rounded-xl bg-[#0062AF] hover:bg-[#004a85] shadow-sm shadow-[#0062AF]/25 hover:shadow-[#0062AF]/40 hover:-translate-y-px transition-all"
                    >
                        <PlusIcon className="h-4 w-4" /> Nouveau Devis
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 space-y-4">

                {/* ══ Hero card ══ */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* ── Header section : fond dégradé subtil + barre brand ── */}
                    <div className="relative overflow-hidden">

                        {/* Barre brand top */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0062AF] via-[#0284c7] to-[#38bdf8]" />

                        {/* Fond très subtil bleu-blanc */}
                        <div className="px-7 pt-7 pb-6"
                            style={{ background: 'linear-gradient(145deg,#eef6ff 0%,#f5faff 40%,#ffffff 100%)' }}>

                            {/* Orbe décoratif discret */}
                            <div className="pointer-events-none absolute -top-10 right-0 h-48 w-48 rounded-full opacity-40"
                                style={{ background: 'radial-gradient(circle,#dbeafe 0%,transparent 70%)' }} />

                            <div className="flex items-start gap-6 relative z-10">

                                {/* ── Avatar ── */}
                                <div className="relative flex-shrink-0">
                                    <div
                                        className="h-[72px] w-[72px] rounded-2xl shadow-lg flex items-center justify-center select-none"
                                        style={{ background: 'linear-gradient(145deg,#0062AF 0%,#003d8c 100%)' }}
                                    >
                                        {displayName.trim()
                                            ? <span className="text-white font-black text-2xl tracking-tight">{initials}</span>
                                            : <BuildingOfficeIcon className="h-8 w-8 text-white/90" />
                                        }
                                    </div>
                                    <span className={`absolute -bottom-1 -right-1 h-[18px] w-[18px] rounded-full border-[3px] border-white shadow ${client.Actif ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                </div>

                                {/* ── Identity ── */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">

                                        {/* Nom */}
                                        <div className="min-w-0">
                                            <h1 className="text-[1.45rem] font-black text-slate-900 tracking-tight leading-tight">
                                                {displayName || client.CodTiers}
                                            </h1>

                                            {/* Badges */}
                                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                {displayName && (
                                                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 tracking-wide shadow-sm">
                                                        {client.CodTiers}
                                                    </span>
                                                )}
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${client.Actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${client.Actif ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                                    {client.Actif ? 'Actif' : 'Inactif'}
                                                </span>
                                                {client.classeAuto && (
                                                    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#e0f0ff] text-[#0062AF] border border-blue-200">
                                                        {client.classeAuto.ClasseCalculee}
                                                    </span>
                                                )}
                                                {!loadingSatisfaction && satisfaction && !satisfaction.isProspect && (
                                                    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                        satisfaction.score >= 8 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        satisfaction.score >= 5 ? 'bg-[#e0f0ff] text-[#0062AF] border-blue-200' :
                                                                                  'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>★ NPS {satisfaction.score}/10</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date discrète */}
                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium flex-shrink-0 pt-0.5">
                                            <CalendarIcon className="h-3 w-3" />
                                            Créé le {client.DateCreation ? new Date(client.DateCreation).toLocaleDateString('fr-FR') : '—'}
                                        </span>
                                    </div>

                                    {/* Meta chips */}
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        {(client.region?.libelle || client.Ville) && (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg">
                                                <MapPinIcon className="h-3 w-3 text-rose-400 flex-shrink-0" />
                                                {client.region?.libelle || client.Ville}
                                            </span>
                                        )}
                                        {client.codRepresTiers && (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg">
                                                <UserCircleIcon className="h-3 w-3 text-[#0062AF] flex-shrink-0" />
                                                Rep. {client.codRepresTiers}
                                            </span>
                                        )}
                                        {(client.tiersCategorieObj?.libelle || client.Categorie) && (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg">
                                                <SparklesIcon className="h-3 w-3 text-violet-400 flex-shrink-0" />
                                                {client.tiersCategorieObj?.libelle || client.Categorie}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── KPI bar — integrated strip, style Stripe ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-t border-slate-100">
                        {[
                            {
                                label: 'C.A Facturé',
                                value: loadingInvoices ? '…' : financialTotals.totalFacture.toLocaleString('fr-TN', { minimumFractionDigits: 3 }),
                                unit: 'TND',
                                icon: ChartBarIcon,
                                dot: 'bg-[#0062AF]',
                                text: 'text-[#0062AF]',
                                iconBg: 'bg-[#e0f0ff] text-[#0062AF]',
                            },
                            {
                                label: 'Reste dû',
                                value: loadingInvoices ? '…' : financialTotals.totalDu.toLocaleString('fr-TN', { minimumFractionDigits: 3 }),
                                unit: 'TND',
                                icon: BanknotesIcon,
                                dot: 'bg-amber-500',
                                text: 'text-amber-600',
                                iconBg: 'bg-amber-50 text-amber-600',
                                extra: !loadingInvoices && financialTotals.totalFacture > 0,
                            },
                            {
                                label: 'Devis',
                                value: clientDevis.length,
                                unit: 'documents',
                                icon: DocumentTextIcon,
                                dot: 'bg-sky-500',
                                text: 'text-slate-800',
                                iconBg: 'bg-sky-50 text-sky-600',
                            },
                            {
                                label: 'Projets',
                                value: clientProjets.length,
                                unit: 'en cours',
                                icon: BriefcaseIcon,
                                dot: 'bg-violet-500',
                                text: 'text-slate-800',
                                iconBg: 'bg-violet-50 text-violet-600',
                            },
                        ].map((k, i) => (
                            <div key={i} className="relative px-6 py-4 hover:bg-slate-50/60 transition-colors group">
                                {/* colored left-border accent on hover */}
                                <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full ${k.dot} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">{k.label}</p>
                                        <p className={`text-[1.5rem] font-black tabular-nums leading-none ${k.text}`}>{k.value}</p>
                                        {k.extra ? (
                                            <div className="mt-2">
                                                <div className="h-1 w-20 rounded-full bg-slate-100 overflow-hidden">
                                                    <div className="h-full rounded-full bg-amber-400 transition-all duration-700"
                                                        style={{ width: `${financialTotals.taux}%` }} />
                                                </div>
                                                <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{financialTotals.taux.toFixed(0)}% recouvré</p>
                                            </div>
                                        ) : (
                                            <p className="text-[9px] text-slate-400 mt-1 font-medium">{k.unit}</p>
                                        )}
                                    </div>
                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${k.iconBg}`}>
                                        <k.icon className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                    {/* Left sidebar */}
                    <div className="lg:col-span-4 space-y-4">

                        {/* Quick actions */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#0062AF]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actions rapides</span>
                            </div>
                            <div className="p-3 space-y-1.5">
                                {[
                                    {
                                        label: 'Nouvelle activité',
                                        desc: 'Enregistrer une interaction',
                                        icon: ClockIcon,
                                        color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500',
                                        onClick: () => navigate('/activites/new', { state: { defaultTierId: client.IDTiers } })
                                    },
                                    {
                                        label: 'Nouveau devis',
                                        desc: 'Créer une proposition',
                                        icon: DocumentTextIcon,
                                        color: 'bg-[#e0f0ff] text-[#0062AF] group-hover:bg-[#0062AF]',
                                        onClick: () => navigate('/devis/new', { state: { defaultCodTiers: client.CodTiers } })
                                    },
                                    {
                                        label: 'Nouveau projet',
                                        desc: 'Démarrer un projet',
                                        icon: BriefcaseIcon,
                                        color: 'bg-violet-50 text-violet-600 group-hover:bg-violet-500',
                                        onClick: () => navigate('/projets/new', { state: { defaultTierId: client.IDTiers } })
                                    },
                                ].map((a, i) => (
                                    <button
                                        key={i}
                                        onClick={a.onClick}
                                        className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group text-left"
                                    >
                                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${a.color}`}>
                                            <a.icon className="h-4 w-4 transition-colors group-hover:text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 group-hover:text-[#0062AF] transition-colors">{a.label}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{a.desc}</p>
                                        </div>
                                        <ArrowRightIcon className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#0062AF] group-hover:translate-x-0.5 transition-all ml-auto flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Coordonnées */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#0062AF]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coordonnées</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {[
                                    { icon: PhoneIcon,          label: 'Téléphone',    value: client.Tel,                                                                                    isPhone: true,  accent: 'bg-emerald-50 text-emerald-600' },
                                    { icon: EnvelopeIcon,       label: 'Email',        value: client.Email,                                                                                  isPhone: false, accent: 'bg-[#e0f0ff] text-[#0062AF]' },
                                    { icon: MapPinIcon,         label: 'Adresse',      value: [client.Adresse, client.region?.libelle || client.Ville].filter(Boolean).join(' · ') || null, isPhone: false, accent: 'bg-rose-50 text-rose-500' },
                                    { icon: IdentificationIcon, label: 'Mat. Fiscale', value: client.CodTva || client.MatriculeFiscale,                                                      isPhone: false, accent: 'bg-amber-50 text-amber-600' },
                                    { icon: UserCircleIcon,     label: 'Commercial',   value: client.codRepresTiers || client.Commercial,                                                    isPhone: false, accent: 'bg-violet-50 text-violet-600' },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70 transition-colors">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${row.accent}`}>
                                            <row.icon className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{row.label}</p>
                                            {row.isPhone
                                                ? renderWhatsAppField(row.value, 'text-xs font-semibold text-slate-700')
                                                : <p className="text-xs font-semibold text-slate-700 truncate">{row.value || <span className="text-slate-300 font-normal italic">Non renseigné</span>}</p>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contacts additionnels */}
                        {(contacts.length > 0 || addresses.length > 0) && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-[#0062AF] flex items-center justify-center shadow-sm">
                                        <UserGroupIcon className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">Contacts</span>
                                    <span className="ml-auto text-[10px] font-bold text-[#0062AF] bg-[#e0f0ff] border border-blue-100 px-2 py-0.5 rounded-full">
                                        {contacts.length + addresses.length}
                                    </span>
                                </div>
                                <div className="p-3 space-y-2">
                                    {contacts.map((c, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:border-slate-200 transition-colors">
                                            <div
                                                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white shadow-sm"
                                                style={{ background: `hsl(${(i * 47 + 210) % 360}, 60%, 50%)` }}
                                            >
                                                {(c.Responsable || '?')[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{c.Responsable || '—'}</p>
                                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                    <PhoneIcon className="h-3 w-3" />
                                                    {renderWhatsAppField(c.Tel, 'font-medium text-slate-600')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {addresses.map((a, i) => (
                                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                                            <MapPinIcon className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-slate-600">{a.Adresse || '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main panel */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                            {/* Pill tabs */}
                            <div className="px-4 pt-4 border-b border-slate-100">
                                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-4">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                                activeTab === tab.id
                                                    ? 'bg-[#0062AF] text-white shadow-sm shadow-[#0062AF]/30'
                                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            <tab.icon className="h-3.5 w-3.5" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab content */}
                            <div className="p-5">

                                {/* ── Infos ── */}
                                {activeTab === 'infos' && (
                                    <div className="space-y-2">
                                        {infoSections.map((section) => {
                                            const isExpanded = expandedSections[section.id];
                                            const cm = sectionColorMap[section.color] || sectionColorMap.blue;
                                            const filledCount = section.fields.filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false).length;
                                            return (
                                                <div
                                                    key={section.id}
                                                    className={`rounded-xl overflow-hidden border transition-all duration-200 ${isExpanded ? `border-current ${cm.header.split(' ')[1]}` : 'border-slate-200'}`}
                                                >
                                                    <button
                                                        onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                                        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${isExpanded ? cm.header : 'bg-slate-50 hover:bg-slate-100/70'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isExpanded ? cm.icon : 'bg-white border border-slate-200 text-slate-400'}`}>
                                                                <section.icon className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className={`text-sm font-bold transition-colors ${isExpanded ? cm.title : 'text-slate-700'}`}>
                                                                {section.title}
                                                            </span>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isExpanded ? cm.badge + ' border-transparent' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                {filledCount}/{section.fields.length}
                                                            </span>
                                                        </div>
                                                        <ChevronDownIcon className={`h-4 w-4 transition-all duration-200 ${isExpanded ? `rotate-180 ${cm.title}` : 'text-slate-300'}`} />
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100">
                                                            {section.fields.map(([label, value]) => {
                                                                const hasVal = value !== null && value !== undefined && value !== '' && value !== false;
                                                                return (
                                                                    <div key={label} className="bg-white px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                                                                        <p className={`text-xs font-semibold ${hasVal ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                                                                            {['Téléphone', 'Mobile', 'Fax'].includes(label)
                                                                                ? renderWhatsAppField(value, 'font-semibold')
                                                                                : formatFieldValue(value)}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* ── Activités ── */}
                                {activeTab === 'activities' && (() => {
                                    const TYPE_CFG = {
                                        'Appel':   { icon: PhoneIcon,        bg: 'bg-emerald-50', iconColor: 'text-emerald-600', solidBg: 'group-hover:bg-emerald-500' },
                                        'Email':   { icon: EnvelopeIcon,     bg: 'bg-[#e0f0ff]',  iconColor: 'text-[#0062AF]',   solidBg: 'group-hover:bg-[#0062AF]'   },
                                        'Réunion': { icon: CalendarIcon,     bg: 'bg-violet-50',  iconColor: 'text-violet-600',  solidBg: 'group-hover:bg-violet-500'  },
                                        'Visite':  { icon: MapPinIcon,       bg: 'bg-rose-50',    iconColor: 'text-rose-600',    solidBg: 'group-hover:bg-rose-500'    },
                                        'Devis':   { icon: DocumentTextIcon, bg: 'bg-sky-50',     iconColor: 'text-sky-600',     solidBg: 'group-hover:bg-sky-500'     },
                                    };
                                    const grouped = clientActivities.reduce((acc, act) => {
                                        const dateKey = act.Date_Activite
                                            ? new Date(act.Date_Activite).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                            : 'Date inconnue';
                                        if (!acc[dateKey]) acc[dateKey] = [];
                                        acc[dateKey].push(act);
                                        return acc;
                                    }, {});

                                    return (
                                        <div className="space-y-3">
                                            {loadingActivities ? (
                                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                    <div className="h-8 w-8 rounded-full border-[3px] border-[#0062AF] border-t-transparent animate-spin" />
                                                    <p className="text-xs text-slate-400">Chargement des activités…</p>
                                                </div>
                                            ) : activitiesError ? (
                                                <div className="py-10 text-center">
                                                    <p className="text-sm text-rose-500">{activitiesError}</p>
                                                </div>
                                            ) : clientActivities.length === 0 ? (
                                                <div className="flex flex-col items-center py-16 text-center gap-3">
                                                    <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                        <ClockIcon className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-500">Aucune activité</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">Aucune interaction enregistrée pour ce client</p>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate('/activites/new', { state: { defaultTierId: client.IDTiers } })}
                                                        className="mt-1 px-4 py-2 text-xs font-bold text-white bg-[#0062AF] rounded-xl hover:bg-[#004a85] transition-all shadow-sm"
                                                    >
                                                        + Première interaction
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    {Object.entries(grouped).map(([dateLabel, acts]) => (
                                                        <div key={dateLabel}>
                                                            <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
                                                                <div className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                                                    <CalendarIcon className="h-2.5 w-2.5 text-slate-400" />
                                                                </div>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest capitalize">{dateLabel}</span>
                                                                <div className="flex-1 h-px bg-slate-100" />
                                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">{acts.length}</span>
                                                            </div>
                                                            {acts.map((activity) => {
                                                                const cfg = TYPE_CFG[activity.Type_Activite] || TYPE_CFG['Email'];
                                                                const Icon = cfg.icon;
                                                                return (
                                                                    <div
                                                                        key={activity.ID_Activite}
                                                                        onClick={() => navigate(`/activites/${activity.ID_Activite}`, { state: { fromClientId: client.IDTiers } })}
                                                                        className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-[#0062AF]/20 hover:bg-[#e0f0ff]/30 hover:shadow-sm transition-all group cursor-pointer mb-1.5"
                                                                    >
                                                                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${cfg.bg} ${cfg.solidBg}`}>
                                                                            <Icon className={`h-4 w-4 ${cfg.iconColor} group-hover:text-white transition-colors`} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <span className="text-sm font-semibold text-slate-800 group-hover:text-[#0062AF] transition-colors">{activity.Type_Activite}</span>
                                                                            <p className="text-xs text-slate-500 truncate mt-0.5">{activity.Description || 'Sans description'}</p>
                                                                        </div>
                                                                        <ArrowUpRightIcon className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#0062AF] transition-colors flex-shrink-0" />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/activites/new', { state: { defaultTierId: client.IDTiers } })}
                                                        className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-400 hover:border-[#0062AF] hover:text-[#0062AF] transition-all mt-1"
                                                    >
                                                        + Nouvelle interaction
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* ── Devis ── */}
                                {activeTab === 'devis' && (
                                    <div className="space-y-2">
                                        {loadingDevis ? (
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <div className="h-8 w-8 rounded-full border-[3px] border-[#0062AF] border-t-transparent animate-spin" />
                                                <p className="text-xs text-slate-400">Chargement des devis…</p>
                                            </div>
                                        ) : clientDevis.length === 0 ? (
                                            <div className="flex flex-col items-center py-16 text-center gap-3">
                                                <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                    <DocumentTextIcon className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-500">Aucun devis</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Créez le premier devis pour ce client</p>
                                                </div>
                                                <button
                                                    onClick={() => navigate('/devis/new', { state: { defaultCodTiers: client.CodTiers } })}
                                                    className="mt-1 px-4 py-2 text-xs font-bold text-white bg-[#0062AF] rounded-xl hover:bg-[#004a85] transition-all shadow-sm"
                                                >
                                                    + Créer un devis
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {clientDevis.map((devis) => {
                                                    const ref = devis.NumDevis || devis.Num || devis.id || '—';
                                                    const date = devis.DateDevis || devis.Date || devis.date;
                                                    const montant = Number(devis.MontantTTC || devis.montant || 0);
                                                    const statut = devis.Statut || devis.statut || '—';
                                                    const isValide = statut === 'Validé' || statut === 'Accepté';
                                                    return (
                                                        <div
                                                            key={devis.IDDevis || devis.id || ref}
                                                            onClick={() => navigate(`/devis/${devis.IDDevis || devis.id}`)}
                                                            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-[#0062AF]/20 hover:bg-[#e0f0ff]/30 hover:shadow-sm transition-all group cursor-pointer"
                                                        >
                                                            <div className="h-9 w-9 bg-[#e0f0ff] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#0062AF] transition-all">
                                                                <DocumentTextIcon className="h-4 w-4 text-[#0062AF] group-hover:text-white transition-colors" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="text-sm font-bold text-slate-800 font-mono group-hover:text-[#0062AF] transition-colors">{ref}</span>
                                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${isValide ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                                        {statut}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400">{date ? formatDate(date) : '—'}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-sm font-black text-slate-700 tabular-nums">
                                                                    {montant.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                                                    <span className="text-[10px] font-semibold text-slate-400 ml-1">TND</span>
                                                                </span>
                                                                <ArrowUpRightIcon className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#0062AF] transition-colors" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/devis/new', { state: { defaultCodTiers: client.CodTiers } })}
                                                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-400 hover:border-[#0062AF] hover:text-[#0062AF] transition-all mt-1"
                                                >
                                                    + Nouveau devis
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* ── Projets ── */}
                                {activeTab === 'projets' && (
                                    <div className="space-y-2">
                                        {loadingProjets ? (
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <div className="h-8 w-8 rounded-full border-[3px] border-[#0062AF] border-t-transparent animate-spin" />
                                                <p className="text-xs text-slate-400">Chargement des projets…</p>
                                            </div>
                                        ) : projetsError ? (
                                            <div className="py-10 text-center">
                                                <p className="text-sm text-rose-500">{projetsError}</p>
                                            </div>
                                        ) : clientProjets.length === 0 ? (
                                            <div className="flex flex-col items-center py-16 text-center gap-3">
                                                <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                    <BriefcaseIcon className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-500">Aucun projet lié</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Associez un projet à ce client</p>
                                                </div>
                                                <button
                                                    onClick={() => navigate('/projets/new', { state: { defaultTierId: client.IDTiers } })}
                                                    className="mt-1 px-4 py-2 text-xs font-bold text-white bg-[#0062AF] rounded-xl hover:bg-[#004a85] transition-all shadow-sm"
                                                >
                                                    + Nouveau projet
                                                </button>
                                            </div>
                                        ) : (
                                            clientProjets.map((projet) => (
                                                <div
                                                    key={projet.ID_Projet}
                                                    onClick={() => navigate(`/projets/${projet.ID_Projet}`, { state: { fromClientId: client.IDTiers } })}
                                                    className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-sm transition-all group cursor-pointer"
                                                >
                                                    <div className="h-9 w-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500 transition-all">
                                                        <BriefcaseIcon className="h-4 w-4 text-violet-600 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors line-clamp-1">{projet.Nom_Projet}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{projet.Phase || '—'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-sm font-bold text-slate-700 tabular-nums">{formatCurrency(projet.Budget_Alloue || 0)}</span>
                                                        <ArrowUpRightIcon className="h-3.5 w-3.5 text-slate-300 group-hover:text-violet-600 transition-colors" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* ── Analyse IA ── */}
                                {activeTab === 'ia' && (
                                    <div className="space-y-5">
                                        {loadingSatisfaction && (
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <div className="h-10 w-10 rounded-full border-[3px] border-[#0062AF] border-t-transparent animate-spin" />
                                                <p className="text-sm text-slate-500 font-medium">Analyse IA en cours…</p>
                                                <p className="text-xs text-slate-400">Calcul du score de satisfaction</p>
                                            </div>
                                        )}
                                        {!loadingSatisfaction && !satisfaction && (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
                                                    <SparklesIcon className="h-7 w-7 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-500">Analyse non disponible</p>
                                                <p className="text-xs text-slate-400 mt-1">Pas assez de données pour ce client</p>
                                            </div>
                                        )}
                                        {!loadingSatisfaction && satisfaction && (() => {
                                            const score = satisfaction.isProspect ? null : (satisfaction.score ?? 0);
                                            const scoreColor = score === null ? 'slate' : score >= 8 ? 'emerald' : score >= 5 ? 'amber' : 'rose';
                                            const scoreLabel = score === null ? 'Prospect' : score >= 8 ? 'Excellent' : score >= 5 ? 'Satisfaisant' : 'À risque';
                                            const circumference = 2 * Math.PI * 54;
                                            const offset = circumference - (circumference * (score !== null ? score / 10 : 0));
                                            const cm = {
                                                slate:   { ring: '#94a3b8', accent: 'from-slate-400 to-slate-500',   bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200'   },
                                                emerald: { ring: '#10b981', accent: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                                                amber:   { ring: '#f59e0b', accent: 'from-amber-400 to-orange-500',  bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
                                                rose:    { ring: '#f43f5e', accent: 'from-rose-400 to-rose-600',     bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
                                            }[scoreColor];
                                            return (
                                                <>
                                                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4">
                                                        {/* Score ring */}
                                                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-4 min-w-[180px]">
                                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Score NPS</p>
                                                            <div className="relative h-36 w-36">
                                                                <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                                                                    <circle cx="64" cy="64" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                                                                    <circle
                                                                        cx="64" cy="64" r="54" fill="none"
                                                                        stroke={cm.ring} strokeWidth="10"
                                                                        strokeDasharray={circumference}
                                                                        strokeDashoffset={offset}
                                                                        strokeLinecap="round"
                                                                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    {score === null
                                                                        ? <span className="text-xl font-bold text-slate-400">N/A</span>
                                                                        : <>
                                                                            <span className={`text-4xl font-black ${cm.text}`}>{score}</span>
                                                                            <span className="text-[10px] text-slate-400">/10</span>
                                                                          </>
                                                                    }
                                                                </div>
                                                            </div>
                                                            <div className={`w-full text-center py-2 rounded-xl text-xs font-bold ${cm.bg} ${cm.text} border ${cm.border}`}>
                                                                {scoreLabel}
                                                            </div>
                                                        </div>

                                                        {/* Metric cards */}
                                                        <div className="grid grid-cols-2 gap-3 content-start">
                                                            {[
                                                                { label: 'Activités',   value: clientActivities.length,           icon: ClockIcon,        gradient: 'from-emerald-400 to-emerald-600' },
                                                                { label: 'Projets',     value: clientProjets.length,              icon: BriefcaseIcon,    gradient: 'from-violet-400 to-violet-600'   },
                                                                { label: 'Devis',       value: clientDevis.length,                icon: DocumentTextIcon, gradient: 'from-sky-400 to-cyan-500'        },
                                                                { label: 'Facteurs IA', value: (satisfaction.factors||[]).length, icon: ChartBarIcon,     gradient: 'from-[#0062AF] to-[#0284c7]'     },
                                                            ].map(m => (
                                                                <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                                                                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                                        <m.icon className="h-5 w-5 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{m.label}</p>
                                                                        <p className="text-2xl font-black text-slate-800 tabular-nums leading-none mt-0.5">{m.value}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {satisfaction.factors?.length > 0 && (
                                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-lg bg-[#0062AF] flex items-center justify-center">
                                                                    <ChartBarIcon className="h-3.5 w-3.5 text-white" />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Facteurs d'impact</span>
                                                                <span className="ml-auto text-[9px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                    {satisfaction.factors.length} facteur{satisfaction.factors.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                            <div className="divide-y divide-slate-100">
                                                                {satisfaction.factors.map((factor, idx) => {
                                                                    const pos = factor.impact >= 0;
                                                                    return (
                                                                        <div key={idx} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                                                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${pos ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                                                                {pos
                                                                                    ? <ArrowUpRightIcon className="h-4 w-4 text-emerald-600" />
                                                                                    : <ChevronDownIcon className="h-4 w-4 text-rose-600" />
                                                                                }
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-semibold text-slate-800">{factor.factor}</p>
                                                                                {factor.desc && <p className="text-xs text-slate-400 mt-0.5">{factor.desc}</p>}
                                                                            </div>
                                                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 border ${pos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                                                {pos ? '+' : ''}{factor.impact}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* ── Règlements ── */}
                                {activeTab === 'reglements' && (
                                    <div className="space-y-3">
                                        {loadingInvoices ? (
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <div className="h-8 w-8 rounded-full border-[3px] border-[#0062AF] border-t-transparent animate-spin" />
                                                <p className="text-xs text-slate-400">Chargement des factures…</p>
                                            </div>
                                        ) : clientInvoices.length === 0 ? (
                                            <div className="flex flex-col items-center py-16 text-center gap-3">
                                                <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                    <BanknotesIcon className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-500">Aucune facture</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Pas encore de factures pour ce client</p>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/clients/${id}/reglements`)}
                                                    className="mt-1 px-4 py-2 text-xs font-semibold text-[#0062AF] border border-blue-200 bg-[#e0f0ff] rounded-xl hover:bg-blue-100 transition-all"
                                                >
                                                    Voir la page règlements
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* KPI résumé */}
                                                <div className="grid grid-cols-3 gap-2 mb-2">
                                                    {[
                                                        { label: 'Total facturé', value: formatCurrency(financialTotals.totalFacture), gradient: 'from-[#0062AF] to-[#0284c7]', text: 'text-white' },
                                                        { label: 'Encaissé',      value: formatCurrency(financialTotals.totalPaye),    gradient: 'from-emerald-500 to-emerald-600', text: 'text-white' },
                                                        { label: 'Reste dû',      value: formatCurrency(financialTotals.totalDu),      gradient: financialTotals.totalDu > 0 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-emerald-600', text: 'text-white' },
                                                    ].map((k) => (
                                                        <div key={k.label} className={`rounded-xl bg-gradient-to-br ${k.gradient} p-3.5 text-center shadow-sm`}>
                                                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-1">{k.label}</p>
                                                            <p className="text-sm font-black tabular-nums text-white">{k.value}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Taux de recouvrement */}
                                                <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 mb-1">
                                                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-2">
                                                        <span>Taux de recouvrement global</span>
                                                        <span className="font-black text-slate-700">{financialTotals.taux.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${
                                                                financialTotals.taux >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                                                financialTotals.taux >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                                                                'bg-gradient-to-r from-rose-400 to-rose-500'
                                                            }`}
                                                            style={{ width: `${financialTotals.taux}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Liste des factures */}
                                                {clientInvoices.map((invoice) => {
                                                    const total     = Number(invoice.TotTTC    || 0);
                                                    const paid      = Number(invoice.MntCredit || 0);
                                                    const remaining = Math.max(total - paid, 0);
                                                    const pct       = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
                                                    const isSettled = remaining <= 0 && total > 0;
                                                    const isPartial = paid > 0 && remaining > 0;
                                                    return (
                                                        <div
                                                            key={invoice.Guid || invoice.Nf}
                                                            onClick={() => navigate(`/fav/${invoice.Guid}`)}
                                                            className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-[#0062AF]/20 hover:bg-[#e0f0ff]/30 hover:shadow-sm transition-all group cursor-pointer"
                                                        >
                                                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                                                                isSettled ? 'bg-emerald-100' : isPartial ? 'bg-amber-100' : 'bg-slate-100'
                                                            }`}>
                                                                <BanknotesIcon className={`h-4 w-4 ${isSettled ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-slate-400'}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-bold text-slate-800 font-mono group-hover:text-[#0062AF] transition-colors">
                                                                        {invoice.Prfx}{invoice.Nf}
                                                                    </span>
                                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                                                        isSettled ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                                        isPartial ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                                        'bg-slate-100 text-slate-500 border-slate-200'
                                                                    }`}>
                                                                        {isSettled ? 'Réglée' : isPartial ? 'Partielle' : 'En attente'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 mb-2">{invoice.DatUser ? formatDate(invoice.DatUser) : '—'}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all ${
                                                                                isSettled ? 'bg-emerald-400' :
                                                                                isPartial ? 'bg-amber-400' : 'bg-slate-300'
                                                                            }`}
                                                                            style={{ width: `${pct}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[9px] text-slate-400 font-bold flex-shrink-0">{pct.toFixed(0)}%</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0 text-right">
                                                                <p className="text-sm font-black text-slate-700 tabular-nums">
                                                                    {total.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                                                    <span className="text-[9px] font-semibold text-slate-400 ml-1">TND</span>
                                                                </p>
                                                                {remaining > 0 && (
                                                                    <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                                                                        −{remaining.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Lien vers page complète */}
                                                <button
                                                    onClick={() => navigate(`/clients/${id}/reglements`)}
                                                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-400 hover:border-[#0062AF] hover:text-[#0062AF] transition-all flex items-center justify-center gap-1.5 mt-1"
                                                >
                                                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                                                    Voir la page règlements complète
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetail;
