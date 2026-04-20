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
import { formatDate, formatCurrency } from '../../utils/format';

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

    const formatFieldValue = (value) => {
        if (value === null || value === undefined || value === '') return '—';
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        return String(value);
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

    return (
        <div className="animate-fade-in space-y-6 pb-12">
            {/* Professional Header - Modern Design */}
            <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate('/clients')}
                            className="h-11 w-11 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex gap-2 mb-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium">
                                    <UserCircleIcon className="h-3 w-3" />
                                    Fiche Client
                                </div>
                                {loadingSatisfaction ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"></div>
                                        Analyse IA...
                                    </div>
                                ) : satisfaction && (
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${satisfaction.isProspect ? 'bg-slate-50 text-slate-600 border-slate-200' : satisfaction.score >= 8 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : satisfaction.score >= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                        <SparklesIcon className="h-3 w-3" />
                                        {satisfaction.isProspect ? 'Prospect (N/A)' : `NPS IA : ${satisfaction.score ?? 0} / 10`}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{client.LibTiers}</h1>
                            <div className="flex items-center gap-3 mt-2 text-sm">
                                <span className="font-semibold text-slate-600">Réf. {client.CodTiers}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <MapPinIcon className="h-4 w-4 text-sky-500" />
                                    {client.Ville || 'Ville non renseignée'}, {client.Pays || 'Tunisie'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/clients/edit/${id}`)}
                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <PencilIcon className="h-4 w-4" />
                            Modifier
                        </button>
                        <button
                            onClick={() => navigate(`/clients/${id}/reglements`)}
                            className="px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-all flex items-center gap-2"
                        >
                            <BanknotesIcon className="h-4 w-4" />
                            Règlements
                        </button>
                        <button
                            onClick={() => navigate('/devis/new')}
                            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-md shadow-sky-200/50 transition-all flex items-center gap-2 font-medium"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Nouveau Devis
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'C.A Total', value: `${client.ChiffreAffairesTotal.toLocaleString('fr-FR')} TND`, icon: ChartBarIcon, color: 'sky' },
                    { label: 'Encours', value: `${client.Solde.toLocaleString('fr-FR')} TND`, icon: DocumentTextIcon, color: client.Solde > 5000 ? 'amber' : 'emerald' },
                    { label: 'Devis', value: client.NombreDevis, icon: DocumentTextIcon, color: 'violet' },
                    { label: 'Projets', value: clientProjets.length, icon: BriefcaseIcon, color: 'sky' },
                ].map((stat, i) => {
                    const colorMap = {
                        sky: { bg: 'bg-sky-50', text: 'text-sky-500', bar: 'bg-sky-400' },
                        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', bar: 'bg-emerald-400' },
                        amber: { bg: 'bg-amber-50', text: 'text-amber-500', bar: 'bg-amber-400' },
                        violet: { bg: 'bg-violet-50', text: 'text-violet-500', bar: 'bg-violet-400' },
                    };
                    const colors = colorMap[stat.color];
                    return (
                        <div key={i} className="card-luxury shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                                    </div>
                                    <div className={`${colors.bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <stat.icon className={`h-5 w-5 ${colors.text}`} />
                                    </div>
                                </div>
                                <div className={`h-1 ${colors.bar} mt-4 rounded-full`}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Identity Card */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600">
                                    <IdentificationIcon className="h-5 w-5" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">Fiche Identité</h3>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {[
                                { icon: PhoneIcon, label: 'Ligne Directe', value: client.Tel },
                                { icon: EnvelopeIcon, label: 'Email', value: client.Email },
                                { icon: MapPinIcon, label: 'Siège Social', value: `${client.Adresse || '—'}, ${client.Cp || client.CodePostal || '—'} ${client.Ville || '—'}` },
                                { icon: IdentificationIcon, label: 'Identifiant Fiscal', value: client.CodTva || client.MatriculeFiscale },
                                { icon: UserCircleIcon, label: 'Commercial', value: client.codRepresTiers || client.Commercial },
                            ].map((item, i) => (
                                <div key={i} className="group hover:bg-sky-50/50 p-3 rounded-xl transition-all">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{item.label}</p>
                                    <div className="flex items-start gap-3">
                                        <div className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5">
                                            <item.icon className="h-full w-full" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contacts & Adresses Card */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                    <UserGroupIcon className="h-5 w-5" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">Contacts & Adresses</h3>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contacts</p>
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">{contacts.length}</span>
                                </div>
                                {contacts.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Aucun contact enregistré</p>
                                ) : (
                                    <div className="space-y-2">
                                        {contacts.map((contact, index) => (
                                            <div key={`contact-${index}`} className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
                                                <p className="text-sm font-semibold text-slate-800 mb-1">{contact.Responsable || '—'}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5"><PhoneIcon className="h-3 w-3" />{contact.Tel || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 pt-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Adresses</p>
                                    <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs font-medium">{addresses.length}</span>
                                </div>
                                {addresses.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Aucune adresse enregistrée</p>
                                ) : (
                                    <div className="space-y-2">
                                        {addresses.map((address, index) => (
                                            <div key={`address-${index}`} className="rounded-xl border border-sky-100 bg-sky-50/30 p-3">
                                                <p className="text-sm font-semibold text-slate-800 flex items-start gap-2"><MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-sky-500" />{address.Adresse || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Activities/Tabs Area */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="card-luxury shadow-sm flex-1 flex flex-col">
                        {/* Modern Tabs */}
                        <div className="border-b border-slate-200 bg-slate-50/50 px-6">
                            <div className="flex gap-1">
                                {[
                                    { id: 'infos', label: 'Infos Complètes' },
                                    { id: 'activities', label: 'Journal Activités' },
                                    { id: 'devis', label: 'Documents Devis' },
                                    { id: 'projets', label: 'Suivi Projets' },
                                    { id: 'ia', label: 'Satisfaction & IA' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-5 py-3.5 text-sm font-medium transition-all relative ${activeTab === tab.id
                                            ? 'text-sky-700 bg-white rounded-t-lg shadow-sm'
                                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Panel Content */}
                        <div className="p-6 flex-1 bg-white">
                            {activeTab === 'infos' && (
                                <div className="space-y-4">
                                    {infoSections.map((section) => {
                                        const isExpanded = expandedSections[section.id];

                                        return (
                                            <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all">
                                                <button
                                                    onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all bg-slate-50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-lg flex items-center justify-center text-sky-600 bg-sky-100">
                                                            <section.icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="text-sm font-semibold text-slate-800">{section.title}</h4>
                                                            <p className="text-xs text-slate-500 mt-0.5">{section.fields.length} champs</p>
                                                        </div>
                                                    </div>
                                                    <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-5 py-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {section.fields.map(([label, value]) => {
                                                            const hasValue = value !== null && value !== undefined && value !== '' && value !== false;
                                                            return (
                                                                <div key={label} className={`py-3 px-4 rounded-lg transition-all ${hasValue ? 'bg-sky-50/50 border border-sky-100' : 'bg-slate-50/50'}`}>
                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</p>
                                                                    <p className={`text-sm font-medium ${hasValue ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                                                        {formatFieldValue(value)}
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

                            {activeTab === 'activities' && (
                                <div className="space-y-3">
                                    {loadingActivities ? (
                                        <div className="flex justify-center py-10 text-sm text-slate-400">
                                            Chargement du journal d'activités...
                                        </div>
                                    ) : activitiesError ? (
                                        <p className="text-sm text-rose-500">{activitiesError}</p>
                                    ) : clientActivities.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                                <ClockIcon className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-500">Aucune activité liée</p>
                                        </div>
                                    ) : (
                                        clientActivities.map((activity) => {
                                            const date = activity.Date_Activite ? new Date(activity.Date_Activite) : null;
                                            return (
                                                <div key={activity.ID_Activite} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 transition-all group">
                                                    <div className="h-11 w-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
                                                        {activity.Type_Activite === 'Appel' ? <PhoneIcon className="h-5 w-5" /> : <EnvelopeIcon className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-semibold text-slate-800">{activity.Type_Activite}</span>
                                                            {date && (
                                                                <span className="text-xs text-slate-500">
                                                                    {date.toLocaleDateString('fr-FR')} • {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-600 line-clamp-1">{activity.Description || 'Aucune description'}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(`/activites/${activity.ID_Activite}`, {
                                                                state: { fromClientId: client.IDTiers },
                                                            })
                                                        }
                                                        className="p-2 text-slate-400 hover:text-sky-600 transition-colors"
                                                    >
                                                        <ArrowUpRightIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate('/activites/new', {
                                                state: {
                                                    defaultTierId: client.IDTiers,
                                                },
                                            })
                                        }
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-sky-300 hover:text-sky-600 transition-all"
                                    >
                                        + Consigner une nouvelle interaction
                                    </button>
                                </div>
                            )}

                            {activeTab === 'devis' && (
                                <div className="space-y-4">
                                    {client.DevisRecents?.length > 0 ? (
                                        client.DevisRecents.map((devis) => (
                                            <div key={devis.id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-soft transition-all group cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-11 w-11 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-gradient-blue group-hover:text-white transition-all">
                                                        <DocumentTextIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-extrabold text-slate-800 tracking-tight font-mono">{devis.id}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(devis.date)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${devis.statut === 'Validé' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {devis.statut}
                                                    </span>
                                                    <span className="text-sm font-black text-slate-800 w-28 text-right">{devis.montant.toLocaleString()} TND</span>
                                                    <div className="p-2 text-slate-300 group-hover:text-blue-600 transition-colors">
                                                        <ArrowUpRightIcon className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Aucun document financier</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'projets' && (
                                <div className="space-y-3">
                                    {loadingProjets ? (
                                        <div className="flex justify-center py-10 text-sm text-slate-400">
                                            Chargement des projets...
                                        </div>
                                    ) : projetsError ? (
                                        <p className="text-sm text-rose-500">{projetsError}</p>
                                    ) : clientProjets.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="h-14 w-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-4 text-sky-500">
                                                <BriefcaseIcon className="h-7 w-7" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-500">Aucun projet lié</p>
                                            <p className="text-xs text-slate-400 mt-2">Créez un projet depuis le module Projets</p>
                                        </div>
                                    ) : (
                                        clientProjets.map((projet) => (
                                            <div
                                                key={projet.ID_Projet}
                                                className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all group cursor-pointer"
                                                onClick={() =>
                                                    navigate(`/projets/${projet.ID_Projet}`, {
                                                        state: { fromClientId: client.IDTiers },
                                                    })
                                                }
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-11 w-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-sky-500 group-hover:text-white transition-all">
                                                        <BriefcaseIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                                                            {projet.Nom_Projet}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {projet.Phase || 'Phase non définie'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {formatCurrency(projet.Budget_Alloue || 0)}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {projet.Date_Echeance ? formatDate(projet.Date_Echeance) : 'Sans échéance'}
                                                    </span>
                                                    <div className="p-2 text-slate-400 group-hover:text-sky-600 transition-colors">
                                                        <ArrowUpRightIcon className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                                    {activeTab === 'ia' && (
                                <div className="animate-fade-in space-y-8 p-2">
                                    {loadingSatisfaction ? (
                                        <div className="py-32 flex flex-col items-center justify-center space-y-4">
                                            <div className="relative h-20 w-20">
                                                <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
                                                <SparklesIcon className="absolute inset-0 m-auto h-8 w-8 text-sky-400 animate-pulse" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-slate-800 font-bold text-lg">Analyse Cognitive en cours</p>
                                                <p className="text-slate-500 text-sm">Le moteur IA ausculte les échanges et l'historique...</p>
                                            </div>
                                        </div>
                                    ) : !satisfaction ? (
                                        <div className="card-luxury p-20 text-center border-dashed border-2 border-slate-200">
                                            <ChartBarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-medium">Données d'analyse non disponibles pour ce profil.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                            {/* Left Column: Score Visualization */}
                                            <div className="lg:col-span-4 flex flex-col items-center justify-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                                                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-center">Satisfaction Globale (NPS)</h4>
                                                
                                                <div className="relative h-48 w-48 flex items-center justify-center">
                                                    {/* SVG Progress Ring */}
                                                    <svg className="h-full w-full transform -rotate-90">
                                                        <circle
                                                            cx="96" cy="96" r="88"
                                                            fill="transparent"
                                                            stroke="currentColor"
                                                            strokeWidth="12"
                                                            className="text-slate-50"
                                                        />
                                                        <circle
                                                            cx="96" cy="96" r="88"
                                                            fill="transparent"
                                                            stroke="currentColor"
                                                            strokeWidth="12"
                                                            strokeDasharray={552.92}
                                                            strokeDashoffset={552.92 - (552.92 * (satisfaction.isProspect ? 0 : (satisfaction.score || 0) / 10))}
                                                            strokeLinecap="round"
                                                            className={`transition-all duration-1000 ease-out ${
                                                                satisfaction.isProspect ? 'text-slate-300' :
                                                                satisfaction.score >= 8 ? 'text-emerald-500' : 
                                                                satisfaction.score >= 5 ? 'text-amber-500' : 'text-rose-500'
                                                            }`}
                                                        />
                                                    </svg>
                                                    <div className="absolute flex flex-col items-center">
                                                        {satisfaction.isProspect ? (
                                                            <span className="text-2xl font-black text-slate-400">N/A</span>
                                                        ) : (
                                                            <>
                                                                <span className="text-5xl font-black text-slate-800 tracking-tighter">
                                                                    {satisfaction.score ?? 0}
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-400 mt-1 uppercase">Sur 10</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-8 text-center space-y-2">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                                        satisfaction.isProspect ? 'bg-slate-100 text-slate-600' :
                                                        satisfaction.score >= 8 ? 'bg-emerald-50 text-emerald-700' : 
                                                        satisfaction.score >= 5 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                                    }`}>
                                                        <SparklesIcon className="h-4 w-4" />
                                                        {satisfaction.isProspect ? 'Compte Prospect' : 
                                                         satisfaction.score >= 8 ? 'Excellent Engagement' : 
                                                         satisfaction.score >= 5 ? 'Relation Stable' : 'Alerte Satisfaction'}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium italic">
                                                        Moteur Analytics v{satisfaction.version || '2.3'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right Column: Breakdown & Recommendations */}
                                            <div className="lg:col-span-8 space-y-6">
                                                <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
                                                    <div className="relative z-10 flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                                Synthèse Cognitive
                                                            </h3>
                                                            <p className="text-slate-400 text-sm mt-1">
                                                                {satisfaction.isProspect ? 
                                                                    "Profil en cours de constitution. Historique insuffisant pour une analyse prédictive." : 
                                                                    "Voici les leviers identifiés par l'IA sur la base de l'interaction client."}
                                                            </p>
                                                        </div>
                                                        <div className="h-12 w-12 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20">
                                                            <DocumentTextIcon className="h-6 w-6 text-sky-400" />
                                                        </div>
                                                    </div>
                                                    {/* Background Glow */}
                                                    <div className="absolute -top-20 -right-20 h-64 w-64 bg-sky-500/20 blur-[100px] rounded-full"></div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(satisfaction.factors || []).map((factor, idx) => {
                                                        const isPositive = factor.impact >= 0;
                                                        return (
                                                            <div key={idx} className="group hover:scale-[1.02] transition-all duration-300">
                                                                <div className={`h-full p-5 rounded-3xl border ${isPositive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'} transition-all`}>
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${isPositive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-rose-500 text-white shadow-lg shadow-rose-200'}`}>
                                                                            {isPositive ? '+' : ''}{factor.impact} IMPACT
                                                                        </div>
                                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                                            {isPositive ? <ArrowUpRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                                                                        </div>
                                                                    </div>
                                                                    <h5 className="font-bold text-slate-800 text-sm">{factor.factor}</h5>
                                                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{factor.desc}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!satisfaction.factors || satisfaction.factors.length === 0) && (
                                                        <div className="col-span-2 p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                            <p className="text-slate-400 text-sm italic">Aucun facteur détecté à ce stade.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Protip Action */}
                                                {!satisfaction.isProspect && (
                                                    <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 flex items-center gap-4">
                                                        <div className="h-10 w-10 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce">
                                                            <SparklesIcon className="h-5 w-5 text-white" />
                                                        </div>
                                                        <p className="text-xs text-sky-800 font-medium">
                                                            <span className="font-bold">Conseil de l'IA :</span> {satisfaction.score < 5 ? 
                                                                "Ce client montre des signes de frustration. Un appel de courtoisie est fortement recommandé." : 
                                                                "La relation est positive. Profitez-en pour proposer de nouveaux produits ou services."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}                    </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetail;
