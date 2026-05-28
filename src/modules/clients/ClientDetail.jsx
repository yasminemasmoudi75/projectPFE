import { useState, useEffect } from 'react';
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
        metadata: false,
    });
    const [clientDevis, setClientDevis] = useState([]);
    const [loadingDevis, setLoadingDevis] = useState(false);
    const [satisfaction, setSatisfaction] = useState(null);
    const [loadingSatisfaction, setLoadingSatisfaction] = useState(false);

    useEffect(() => {
        const fetchClientDetails = async () => {
            try {
                const response = await axios.get(`/tiers/${id}`);
                const payload = response.data;
                const realData = payload?.data || payload;

                if (!realData) {
                    setClient(null);
                    return;
                }

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

        if (id) {
            fetchClientDetails();
        }
    }, [id]);

    // Charger les activités liées à ce client
    useEffect(() => {
        const fetchClientActivities = async () => {
            if (!client?.IDTiers) return;
            setLoadingActivities(true);
            setActivitiesError(null);
            try {
                const response = await axios.get('/activites', {
                    params: { tierId: client.IDTiers },
                });
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

    // Charger les projets liés à ce client
    useEffect(() => {
        const fetchClientProjets = async () => {
            if (!client?.IDTiers) return;
            setLoadingProjets(true);
            setProjetsError(null);
            try {
                const response = await axios.get('/projets', {
                    params: { page: 1, limit: 100 },
                });
                const rows = response.data?.data || response.data || [];
                const projetsForClient = Array.isArray(rows)
                    ? rows.filter(
                        (p) =>
                            p.IDTiers === client.IDTiers ||
                            p.client?.IDTiers === client.IDTiers
                    )
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

    // Charger les devis liés à ce client
    useEffect(() => {
        const fetchClientDevis = async () => {
            if (!client?.CodTiers) return;
            setLoadingDevis(true);
            try {
                const response = await axios.get('/devis', {
                    params: { codTiers: client.CodTiers, limit: 50 },
                });
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

    // Charger la satisfaction IA
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

    if (loading) return <LoadingSpinner />;
    if (!client) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-slate-500 font-bold mb-4">Client non trouvé</p>
            <button onClick={() => navigate('/clients')} className="btn-soft-primary">Retour à la liste</button>
        </div>
    );

    const stats = [
        { label: 'C.A Total', value: `${client.ChiffreAffairesTotal.toLocaleString('fr-FR')} TND`, icon: ChartBarIcon, gradient: 'bg-gradient-blue shadow-glow-blue' },
        { label: 'Encours', value: `${client.Solde.toLocaleString('fr-FR')} TND`, icon: DocumentTextIcon, gradient: client.Solde > 5000 ? 'bg-gradient-warning shadow-glow-amber' : 'bg-gradient-success shadow-glow-emerald' },
        { label: 'Devis', value: client.NombreDevis, icon: DocumentTextIcon, gradient: 'bg-gradient-blue-cyan shadow-glow-blue' },
        { label: 'Projets', value: clientProjets.length, icon: BriefcaseIcon, gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-200' },
    ];

    const contacts = Array.isArray(client.contacts) ? client.contacts : [];
    const addresses = Array.isArray(client.addresses) ? client.addresses : [];

    const formatFieldValue = (value, label = '') => {
        if (value === null || value === undefined || value === '') return '—';
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        return String(value);
    };

    const renderWhatsAppField = (value, className = '') => {
        const link = getWhatsAppLink(value);

        if (!link) {
            return <span className={className}>{formatFieldValue(value)}</span>;
        }

        return (
            <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`${className} hover:text-emerald-600 hover:underline flex items-center gap-1.5 transition-all`}
            >
                {value}
                <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>
        );
    };

    const fullInfoFields = [
        ['IDTiers', client.IDTiers],
        ['Niveau', client.Niveau],
        ['CodTiers', client.CodTiers],
        ['Raisoc', client.Raisoc],
        ['Cin', client.Cin],
        ['RC', client.RC],
        ['Email', client.Email],
        ['Tel', client.Tel],
        ['Fax', client.Fax],
        ['Gsm', client.Gsm],
        ['www', client.www],
        ['Adresse', client.Adresse],
        ['Ville', client.Ville],
        ['Pays', client.Pays],
        ['Cp', client.Cp || client.CodePostal],
        ['CodTva', client.CodTva || client.MatriculeFiscale],
        ['Remise', client.Remise],
        ['NbrCreditJour', client.NbrCreditJour],
        ['Plafondcredit', client.Plafondcredit],
        ['ModReg', client.ModReg],
        ['DetailReg', client.DetailReg],
        ['Banque', client.Banque],
        ['TextExonor', client.TextExonor],
        ['Blockage', client.Blockage],
        ['Timbre', client.Timbre],
        ['Major', client.Major],
        ['Exonor', client.Exonor],
        ['assujet', client.assujet],
        ['Actif', client.Actif],
        ['Fictif', client.Fictif],
        ['Pub', client.Pub],
        ['AdresseMaps', client.AdresseMaps],
        ['MapsVille', client.MapsVille],
        ['MapsPays', client.MapsPays],
        ['MapsDistrict', client.MapsDistrict],
        ['MapsRegion', client.MapsRegion],
        ['MapsSubRegion', client.MapsSubRegion],
        ['gouvernorat', client.gouvernorat],
        ['lat', client.lat],
        ['long', client.long],
        ['codRepresTiers', client.codRepresTiers || client.Commercial],
        ['UserCreate', client.UserCreate],
        ['SaveDate', client.SaveDate],
        ['DateCreatUser', client.DateCreatUser],
        ['dateUp', client.dateUp],
    ];

    const infoSections = [
        {
            id: 'identity',
            title: 'Identité & Légal',
            icon: IdentificationIcon,
            fields: [
                ['IDTiers', client.IDTiers],
                ['Niveau', client.Niveau],
                ['CodTiers', client.CodTiers],
                ['Raisoc', client.Raisoc],
                ['Classe', client.tiersClasse?.libelle],
                ['Gouvernorat', client.region?.libelle || client.Region?.libelle || client.tiersGouvernorat?.libelle],
                ['Ville', client.Ville],
                ['Catégorie', client.tiersCategorieObj?.libelle || client.Categorie],
                ['RC', client.RC],
            ]
        },
        {
            id: 'contact',
            title: 'Contact & Communication',
            icon: PhoneIcon,
            fields: [
                ['Email', client.Email],
                ['Tel', client.Tel],
                ['Fax', client.Fax],
                ['Gsm', client.Gsm],
                ['www', client.www],
            ]
        },
        {
            id: 'financial',
            title: 'Conditions Financières',
            icon: DocumentTextIcon,
            fields: [
                ['Remise', client.Remise],
                ['NbrCreditJour', client.NbrCreditJour],
                ['Plafondcredit', client.Plafondcredit],
                ['ModReg', client.ModReg],
                ['DetailReg', client.DetailReg],
                ['Banque', client.Banque],
            ]
        },
        {
            id: 'tax',
            title: 'Fiscalité & Taxes',
            icon: BriefcaseIcon,
            fields: [
                ['CodTva', client.CodTva || client.MatriculeFiscale],
                ['TextExonor', client.TextExonor],
                ['Exonor', client.Exonor],
                ['assujet', client.assujet],
                ['Blockage', client.Blockage],
                ['Timbre', client.Timbre],
                ['Major', client.Major],
            ]
        },
        {
            id: 'status',
            title: 'Statut & Flags',
            icon: SparklesIcon,
            fields: [
                ['Actif', client.Actif],
                ['Fictif', client.Fictif],
                ['Pub', client.Pub],
            ]
        },
        {
            id: 'location',
            title: 'Adresse & Localisation',
            icon: MapPinIcon,
            fields: [
                ['Adresse', client.Adresse],
                ['Ville', client.Ville],
                ['Pays', client.Pays],
                ['Cp', client.Cp || client.CodePostal],
                ['gouvernorat', client.gouvernorat],
                ['AdresseMaps', client.AdresseMaps],
                ['MapsVille', client.MapsVille],
                ['MapsPays', client.MapsPays],
                ['MapsDistrict', client.MapsDistrict],
                ['MapsRegion', client.MapsRegion],
                ['MapsSubRegion', client.MapsSubRegion],
                ['lat', client.lat],
                ['long', client.long],
            ]
        },
        {
            id: 'metadata',
            title: 'Métadonnées système',
            icon: CalendarIcon,
            fields: [
                ['codRepresTiers', client.codRepresTiers || client.Commercial],
                ['UserCreate', client.UserCreate],
                ['SaveDate', client.SaveDate],
                ['DateCreatUser', client.DateCreatUser],
                ['dateUp', client.dateUp],
            ]
        }
    ];

    const TABS = [
        { id: 'infos',      label: 'Informations',  icon: IdentificationIcon },
        { id: 'activities', label: 'Activités',      icon: ClockIcon          },
        { id: 'devis',      label: 'Devis',          icon: DocumentTextIcon   },
        { id: 'projets',    label: 'Projets',        icon: BriefcaseIcon      },
        { id: 'ia',         label: 'Analyse IA',     icon: SparklesIcon       },
        { id: 'reglements', label: 'Règlements',     icon: BanknotesIcon      },
    ];

    return (
        <div className="min-h-screen bg-slate-50/60 pb-12">

            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                        {/* Left — nav + title */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/clients')}
                                className="group h-10 w-10 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                            >
                                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                            </button>

                            <div className="flex items-center gap-4">
                                {/* Avatar initiales */}
                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #004792, #0070cc)' }}>
                                    {(client.LibTiers || '?')[0].toUpperCase()}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h1 className="text-xl font-bold text-slate-800">{client.LibTiers}</h1>
                                        {client.classeAuto && (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                client.classeAuto.ClasseCalculee === 'Diamant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                client.classeAuto.ClasseCalculee === 'Gold'    ? 'bg-amber-50  text-amber-700  border-amber-200'  :
                                                client.classeAuto.ClasseCalculee === 'Silver'  ? 'bg-slate-50  text-slate-700  border-slate-200'  :
                                                client.classeAuto.ClasseCalculee === 'Passif'  ? 'bg-rose-50   text-rose-700   border-rose-200'   :
                                                                                                 'bg-sky-50    text-sky-700    border-sky-200'
                                            }`}>{client.classeAuto.ClasseCalculee}</span>
                                        )}
                                        {!loadingSatisfaction && satisfaction && !satisfaction.isProspect && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                satisfaction.score >= 8 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                satisfaction.score >= 5 ? 'bg-amber-50   text-amber-700   border-amber-200'   :
                                                                          'bg-rose-50    text-rose-700    border-rose-200'
                                            }`}>NPS {satisfaction.score}/10</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="font-mono font-semibold text-slate-600">{client.CodTiers}</span>
                                        {(client.Ville || client.Pays) && (
                                            <>
                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                <span className="flex items-center gap-1">
                                                    <MapPinIcon className="h-3 w-3 text-slate-400" />
                                                    {[client.Ville, client.Pays || 'Tunisie'].filter(Boolean).join(', ')}
                                                </span>
                                            </>
                                        )}
                                        {client.Email && (
                                            <>
                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                <span className="flex items-center gap-1">
                                                    <EnvelopeIcon className="h-3 w-3 text-slate-400" />
                                                    {client.Email}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right — actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => navigate(`/clients/edit/${id}`)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                            >
                                <PencilIcon className="h-4 w-4" />
                                Modifier
                            </button>
                            <button
                                onClick={() => navigate('/devis/new', { state: { defaultCodTiers: client.CodTiers } })}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all"
                                style={{ background: '#004792' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#003370'}
                                onMouseLeave={e => e.currentTarget.style.background = '#004792'}
                            >
                                <PlusIcon className="h-4 w-4" />
                                Nouveau Devis
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">

                {/* ── KPI Strip ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'C.A Total',  value: `${client.ChiffreAffairesTotal.toLocaleString('fr-FR')} TND`, icon: ChartBarIcon,    border: 'border-l-[#004792]', iconBg: 'bg-blue-50',    iconColor: 'text-[#004792]' },
                        { label: 'Encours',    value: `${client.Solde.toLocaleString('fr-FR')} TND`,               icon: BanknotesIcon,   border: client.Solde > 5000 ? 'border-l-amber-400' : 'border-l-emerald-400', iconBg: client.Solde > 5000 ? 'bg-amber-50' : 'bg-emerald-50', iconColor: client.Solde > 5000 ? 'text-amber-600' : 'text-emerald-600' },
                        { label: 'Devis',      value: clientDevis.length,                                           icon: DocumentTextIcon, border: 'border-l-violet-400', iconBg: 'bg-violet-50',  iconColor: 'text-violet-600' },
                        { label: 'Projets',    value: clientProjets.length,                                         icon: BriefcaseIcon,   border: 'border-l-sky-400',    iconBg: 'bg-sky-50',     iconColor: 'text-sky-600'    },
                    ].map((kpi, i) => (
                        <div key={i} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${kpi.border} shadow-sm p-5 flex items-center justify-between gap-4`}>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                                <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                            </div>
                            <div className={`h-11 w-11 rounded-xl ${kpi.iconBg} flex items-center justify-center flex-shrink-0`}>
                                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Body ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-5">

                        {/* Fiche Identité */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[#004792]/10 flex items-center justify-center">
                                    <IdentificationIcon className="h-4 w-4 text-[#004792]" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">Fiche Identité</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {[
                                    { icon: PhoneIcon,          label: 'Téléphone',   value: client.Tel,                                    isPhone: true  },
                                    { icon: EnvelopeIcon,       label: 'Email',       value: client.Email,                                  isPhone: false },
                                    { icon: MapPinIcon,         label: 'Adresse',     value: [client.Adresse, client.Ville].filter(Boolean).join(', ') || null, isPhone: false },
                                    { icon: IdentificationIcon, label: 'Mat. Fiscale',value: client.CodTva || client.MatriculeFiscale,       isPhone: false },
                                    { icon: UserCircleIcon,     label: 'Commercial',  value: client.codRepresTiers || client.Commercial,     isPhone: false },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <row.icon className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{row.label}</p>
                                            {row.isPhone
                                                ? renderWhatsAppField(row.value, 'text-sm font-medium text-slate-700 break-all')
                                                : <p className="text-sm font-medium text-slate-700 break-all">{row.value || '—'}</p>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contacts */}
                        {(contacts.length > 0 || addresses.length > 0) && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <UserGroupIcon className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800">Contacts & Adresses</h3>
                                    <span className="ml-auto text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{contacts.length + addresses.length}</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    {contacts.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Responsables</p>
                                            {contacts.map((c, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-bold text-emerald-700">{(c.Responsable || '?')[0]}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{c.Responsable || '—'}</p>
                                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                                            <PhoneIcon className="h-3 w-3" />
                                                            {renderWhatsAppField(c.Tel, 'font-medium')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {addresses.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sites secondaires</p>
                                            {addresses.map((a, i) => (
                                                <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <MapPinIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-sm text-slate-700">{a.Adresse || '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main panel */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                            {/* Tabs */}
                            <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                                            activeTab === tab.id
                                                ? 'border-[#004792] text-[#004792] bg-blue-50/40'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab content */}
                            <div className="p-6">

                                {/* ── Infos ── */}
                                {activeTab === 'infos' && (
                                    <div className="space-y-3">
                                        {infoSections.map((section) => {
                                            const isExpanded = expandedSections[section.id];
                                            return (
                                                <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                                        className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-[#004792]/10 flex items-center justify-center">
                                                                <section.icon className="h-4 w-4 text-[#004792]" />
                                                            </div>
                                                            <span className="text-sm font-semibold text-slate-700">{section.title}</span>
                                                            <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">{section.fields.length}</span>
                                                        </div>
                                                        <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {section.fields.map(([label, value]) => {
                                                                const hasVal = value !== null && value !== undefined && value !== '' && value !== false;
                                                                return (
                                                                    <div key={label} className={`px-4 py-3 rounded-xl border ${hasVal ? 'bg-blue-50/40 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                                                                        <p className={`text-sm font-medium ${hasVal ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                                                            {['Tel', 'Gsm', 'Fax'].includes(label)
                                                                                ? renderWhatsAppField(value, 'font-medium')
                                                                                : formatFieldValue(value, label)}
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
                                {activeTab === 'activities' && (
                                    <div className="space-y-3">
                                        {loadingActivities ? (
                                            <div className="flex items-center justify-center py-16 text-sm text-slate-400 gap-2">
                                                <ArrowPathIcon className="h-4 w-4 animate-spin" /> Chargement…
                                            </div>
                                        ) : activitiesError ? (
                                            <p className="text-sm text-rose-500 text-center py-8">{activitiesError}</p>
                                        ) : clientActivities.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                                    <ClockIcon className="h-7 w-7 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-500">Aucune activité</p>
                                                <p className="text-xs text-slate-400 mt-1">Aucune interaction enregistrée pour ce client</p>
                                            </div>
                                        ) : clientActivities.map((activity) => {
                                            const date = activity.Date_Activite ? new Date(activity.Date_Activite) : null;
                                            return (
                                                <div key={activity.ID_Activite} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/20 transition-all group cursor-pointer"
                                                    onClick={() => navigate(`/activites/${activity.ID_Activite}`, { state: { fromClientId: client.IDTiers } })}>
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 group-hover:bg-[#004792] group-hover:text-white transition-all">
                                                        {activity.Type_Activite === 'Appel' ? <PhoneIcon className="h-4 w-4" /> : <EnvelopeIcon className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-sm font-semibold text-slate-800">{activity.Type_Activite}</span>
                                                            {date && <span className="text-xs text-slate-400">{date.toLocaleDateString('fr-FR')}</span>}
                                                        </div>
                                                        <p className="text-xs text-slate-500 truncate">{activity.Description || 'Aucune description'}</p>
                                                    </div>
                                                    <ArrowUpRightIcon className="h-4 w-4 text-slate-300 group-hover:text-[#004792] transition-colors flex-shrink-0" />
                                                </div>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => navigate('/activites/new', { state: { defaultTierId: client.IDTiers } })}
                                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-[#004792] hover:text-[#004792] transition-all"
                                        >
                                            + Consigner une nouvelle interaction
                                        </button>
                                    </div>
                                )}

                                {/* ── Devis ── */}
                                {activeTab === 'devis' && (
                                    <div className="space-y-3">
                                        {loadingDevis ? (
                                            <div className="flex items-center justify-center py-16 text-sm text-slate-400 gap-2">
                                                <ArrowPathIcon className="h-4 w-4 animate-spin" /> Chargement…
                                            </div>
                                        ) : clientDevis.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                                    <DocumentTextIcon className="h-7 w-7 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-500">Aucun document</p>
                                            </div>
                                        ) : clientDevis.map((devis) => {
                                            const ref = devis.NumDevis || devis.Num || devis.id || '—';
                                            const date = devis.DateDevis || devis.Date || devis.date;
                                            const montant = Number(devis.MontantTTC || devis.montant || 0);
                                            const statut = devis.Statut || devis.statut || '—';
                                            const isValide = statut === 'Validé' || statut === 'Accepté';
                                            return (
                                                <div key={devis.IDDevis || devis.id || ref}
                                                    onClick={() => navigate(`/devis/${devis.IDDevis || devis.id}`)}
                                                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#004792] group-hover:text-white transition-all">
                                                            <DocumentTextIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 font-mono">{ref}</p>
                                                            <p className="text-xs text-slate-400">{date ? formatDate(date) : '—'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${isValide ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{statut}</span>
                                                        <span className="text-sm font-bold text-slate-800 tabular-nums">{montant.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</span>
                                                        <ArrowUpRightIcon className="h-4 w-4 text-slate-300 group-hover:text-[#004792] transition-colors" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <button type="button"
                                            onClick={() => navigate('/devis/new', { state: { defaultTierId: client.IDTiers, defaultCodTiers: client.CodTiers } })}
                                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-[#004792] hover:text-[#004792] transition-all">
                                            + Créer un nouveau devis
                                        </button>
                                    </div>
                                )}

                                {/* ── Projets ── */}
                                {activeTab === 'projets' && (
                                    <div className="space-y-3">
                                        {loadingProjets ? (
                                            <div className="flex items-center justify-center py-16 text-sm text-slate-400 gap-2">
                                                <ArrowPathIcon className="h-4 w-4 animate-spin" /> Chargement…
                                            </div>
                                        ) : projetsError ? (
                                            <p className="text-sm text-rose-500 text-center py-8">{projetsError}</p>
                                        ) : clientProjets.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                                    <BriefcaseIcon className="h-7 w-7 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-500">Aucun projet lié</p>
                                            </div>
                                        ) : clientProjets.map((projet) => (
                                            <div key={projet.ID_Projet}
                                                onClick={() => navigate(`/projets/${projet.ID_Projet}`, { state: { fromClientId: client.IDTiers } })}
                                                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-[#004792] group-hover:text-white transition-all">
                                                        <BriefcaseIcon className="h-5 w-5 text-slate-500 group-hover:text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{projet.Nom_Projet}</p>
                                                        <p className="text-xs text-slate-400">{projet.Phase || '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(projet.Budget_Alloue || 0)}</span>
                                                    <ArrowUpRightIcon className="h-4 w-4 text-slate-300 group-hover:text-[#004792] transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Analyse IA ── */}
                                {activeTab === 'ia' && (
                                    <div className="space-y-5">
                                        {loadingSatisfaction && (
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <div className="h-10 w-10 rounded-full border-[3px] border-[#004792] border-t-transparent animate-spin" />
                                                <p className="text-sm text-slate-500">Analyse IA en cours…</p>
                                            </div>
                                        )}
                                        {!loadingSatisfaction && !satisfaction && (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                                    <ChartBarIcon className="h-7 w-7 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-500">Analyse non disponible</p>
                                            </div>
                                        )}
                                        {!loadingSatisfaction && satisfaction && (() => {
                                            const score = satisfaction.isProspect ? null : (satisfaction.score ?? 0);
                                            const scoreColor = score === null ? 'slate' : score >= 8 ? 'emerald' : score >= 5 ? 'amber' : 'rose';
                                            const scoreLabel = score === null ? 'Prospect' : score >= 8 ? 'Excellent' : score >= 5 ? 'Satisfaisant' : 'À risque';
                                            const circumference = 2 * Math.PI * 54;
                                            const offset = circumference - (circumference * (score !== null ? score / 10 : 0));
                                            const cm = {
                                                slate:   { ring: '#94a3b8', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200'  },
                                                emerald: { ring: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                                                amber:   { ring: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
                                                rose:    { ring: '#f43f5e', bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
                                            }[scoreColor];
                                            return (
                                                <>
                                                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5">
                                                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-4 min-w-[180px]">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Score NPS</p>
                                                            <div className="relative h-36 w-36">
                                                                <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                                                                    <circle cx="64" cy="64" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                                                                    <circle cx="64" cy="64" r="54" fill="none" stroke={cm.ring} strokeWidth="10"
                                                                        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                                                                        style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    {score === null ? <span className="text-xl font-bold text-slate-400">N/A</span> : (
                                                                        <><span className={`text-4xl font-black ${cm.text}`}>{score}</span><span className="text-[10px] text-slate-400">/10</span></>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={`w-full text-center py-2 rounded-xl text-xs font-bold ${cm.bg} ${cm.text} border ${cm.border}`}>{scoreLabel}</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 content-start">
                                                            {[
                                                                { label: 'Activités',   value: clientActivities.length, icon: ClockIcon,        bg: 'bg-sky-50',     color: 'text-sky-600'     },
                                                                { label: 'Projets',     value: clientProjets.length,    icon: BriefcaseIcon,    bg: 'bg-violet-50',  color: 'text-violet-600'  },
                                                                { label: 'Devis',       value: clientDevis.length,      icon: DocumentTextIcon, bg: 'bg-amber-50',   color: 'text-amber-600'   },
                                                                { label: 'Facteurs IA', value: (satisfaction.factors||[]).length, icon: ChartBarIcon, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                                                            ].map(m => (
                                                                <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                                                                    <div className={`h-9 w-9 rounded-xl ${m.bg} flex items-center justify-center flex-shrink-0`}>
                                                                        <m.icon className={`h-4 w-4 ${m.color}`} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{m.label}</p>
                                                                        <p className="text-xl font-bold text-slate-700">{m.value}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {satisfaction.factors?.length > 0 && (
                                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                                                <ChartBarIcon className="h-4 w-4 text-slate-400" />
                                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Facteurs d'impact</span>
                                                                <span className="ml-auto text-[10px] text-slate-400">{satisfaction.factors.length} facteur{satisfaction.factors.length !== 1 ? 's' : ''}</span>
                                                            </div>
                                                            <div className="divide-y divide-slate-100">
                                                                {satisfaction.factors.map((factor, idx) => {
                                                                    const pos = factor.impact >= 0;
                                                                    return (
                                                                        <div key={idx} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                                                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${pos ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                                                                {pos ? <ArrowUpRightIcon className="h-4 w-4 text-emerald-600" /> : <ChevronDownIcon className="h-4 w-4 text-rose-600" />}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-semibold text-slate-800">{factor.factor}</p>
                                                                                {factor.desc && <p className="text-xs text-slate-400 mt-0.5">{factor.desc}</p>}
                                                                            </div>
                                                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${pos ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
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
                                    <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                            <BanknotesIcon className="h-7 w-7 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">Historique des règlements</p>
                                            <p className="text-xs text-slate-400 mt-1">Paiements et encaissements de ce client</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/clients/${id}/reglements`)}
                                            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                                            style={{ background: '#004792' }}
                                        >
                                            <BanknotesIcon className="h-4 w-4" />
                                            Voir les règlements
                                        </button>
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