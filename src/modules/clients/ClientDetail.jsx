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
                                {client.classeAuto && (
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${client.classeAuto.ClasseCalculee === 'Diamant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                        client.classeAuto.ClasseCalculee === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            client.classeAuto.ClasseCalculee === 'Silver' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                client.classeAuto.ClasseCalculee === 'Passif' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    client.classeAuto.ClasseCalculee === 'Inactif' ? 'bg-slate-100 text-slate-500 border-slate-300' :
                                                        'bg-sky-50 text-sky-700 border-sky-200'
                                        }`}>
                                        <SparklesIcon className="h-3 w-3" />
                                        {client.classeAuto.ClasseCalculee}
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
                                        {['Ligne Directe', 'Mobile', 'Gsm', 'Tel', 'Fax'].some(l => item.label.includes(l))
                                            ? renderWhatsAppField(item.value, 'text-sm font-medium text-slate-700')
                                            : <p className="text-sm font-medium text-slate-700">{item.value || '—'}</p>
                                        }
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
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-semibold text-slate-800">{contact.Responsable || '—'}</p>
                                                    {contact.classeAuto && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${contact.classeAuto.ClasseCalculee === 'Diamant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                            contact.classeAuto.ClasseCalculee === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                contact.classeAuto.ClasseCalculee === 'Silver' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                                    contact.classeAuto.ClasseCalculee === 'Passif' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                        contact.classeAuto.ClasseCalculee === 'Inactif' ? 'bg-slate-100 text-slate-500 border-slate-300' :
                                                                            'bg-sky-50 text-sky-700 border-sky-200'
                                                            }`}>
                                                            {contact.classeAuto.ClasseCalculee}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <PhoneIcon className="h-3 w-3" />
                                                    {renderWhatsAppField(contact.Tel, 'font-medium')}
                                                </div>
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
                                    { id: 'infos',      label: 'Infos Complètes'  },
                                    { id: 'activities', label: 'Journal Activités' },
                                    { id: 'devis',      label: 'Documents Devis'  },
                                    { id: 'projets',    label: 'Suivi Projets'    },
                                    { id: 'ia',         label: 'Satisfaction & IA'},
                                    { id: 'reglements', label: 'Règlements'       },
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
                                <div className="space-y-3">
                                    {loadingDevis ? (
                                        <div className="flex justify-center py-10 text-sm text-slate-400">
                                            Chargement des documents…
                                        </div>
                                    ) : clientDevis.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                                <DocumentTextIcon className="h-7 w-7 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-500">Aucun document</p>
                                            <p className="text-xs text-slate-400 mt-1">Aucun devis ou facture trouvé pour ce client</p>
                                        </div>
                                    ) : (
                                        clientDevis.map((devis) => {
                                            const ref = devis.NumDevis || devis.Num || devis.id || '—';
                                            const date = devis.DateDevis || devis.Date || devis.date;
                                            const montant = Number(devis.MontantTTC || devis.montant || 0);
                                            const statut = devis.Statut || devis.statut || '—';
                                            const isValide = statut === 'Validé' || statut === 'Accepté';
                                            return (
                                                <div
                                                    key={devis.IDDevis || devis.id || ref}
                                                    onClick={() => navigate(`/devis/${devis.IDDevis || devis.id}`)}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all group cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-11 w-11 bg-slate-50 rounded-xl flex items-center justify-center text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-all">
                                                            <DocumentTextIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 font-mono">{ref}</p>
                                                            <p className="text-xs text-slate-400">{date ? formatDate(date) : '—'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${isValide ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {statut}
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-800 tabular-nums w-28 text-right">
                                                            {montant.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                                                        </span>
                                                        <ArrowUpRightIcon className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/devis/new', { state: { defaultTierId: client.IDTiers, defaultCodTiers: client.CodTiers } })}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-sky-300 hover:text-sky-600 transition-all"
                                    >
                                        + Créer un nouveau devis
                                    </button>
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
                                </div>
                            )}

                            {activeTab === 'ia' && (
                                <div className="space-y-5">

                                    {/* ── Loading ── */}
                                    {loadingSatisfaction && (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <div className="h-10 w-10 rounded-full border-[3px] border-sky-600 border-t-transparent animate-spin" />
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-slate-700">Analyse IA en cours…</p>
                                                <p className="text-xs text-slate-400 mt-1">Calcul du score de satisfaction client</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── No data ── */}
                                    {!loadingSatisfaction && !satisfaction && (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                                <ChartBarIcon className="h-7 w-7 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-500">Analyse non disponible</p>
                                            <p className="text-xs text-slate-400 mt-1">Aucune donnée d'interaction suffisante pour ce profil</p>
                                        </div>
                                    )}

                                    {/* ── Main content ── */}
                                    {!loadingSatisfaction && satisfaction && (() => {
                                        const score = satisfaction.isProspect ? null : (satisfaction.score ?? 0);
                                        const scoreColor = score === null ? 'slate' : score >= 8 ? 'emerald' : score >= 5 ? 'amber' : 'rose';
                                        const scoreLabel = score === null ? 'Prospect' : score >= 8 ? 'Excellent' : score >= 5 ? 'Satisfaisant' : 'À risque';
                                        const circumference = 2 * Math.PI * 54; // r=54
                                        const offset = circumference - (circumference * (score !== null ? score / 10 : 0));
                                        const colorMap = {
                                            slate:   { ring: '#94a3b8', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',  badge: 'bg-slate-100 text-slate-600'   },
                                            emerald: { ring: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
                                            amber:   { ring: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700'   },
                                            rose:    { ring: '#f43f5e', bg: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700'     },
                                        };
                                        const c = colorMap[scoreColor];

                                        return (
                                            <>
                                            {/* ── Header banner ── */}
                                            <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center">
                                                        <SparklesIcon className="h-5 w-5 text-sky-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">Analyse Satisfaction Client</p>
                                                        <p className="text-xs text-slate-400">Moteur IA · version {satisfaction.version || '2.3'} · {new Date().toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${c.badge} ${c.border}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${scoreColor === 'emerald' ? 'bg-emerald-500' : scoreColor === 'amber' ? 'bg-amber-500' : scoreColor === 'rose' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                                                    {scoreLabel}
                                                </span>
                                            </div>

                                            {/* ── Score + Metrics ── */}
                                            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5">

                                                {/* Score ring */}
                                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center gap-4 min-w-[180px]">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Score NPS</p>
                                                    <div className="relative h-36 w-36">
                                                        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                                                            <circle cx="64" cy="64" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                                            <circle
                                                                cx="64" cy="64" r="54"
                                                                fill="none"
                                                                stroke={c.ring}
                                                                strokeWidth="10"
                                                                strokeDasharray={circumference}
                                                                strokeDashoffset={offset}
                                                                strokeLinecap="round"
                                                                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            {score === null ? (
                                                                <span className="text-xl font-bold text-slate-400">N/A</span>
                                                            ) : (
                                                                <>
                                                                    <span className={`text-4xl font-black ${c.text}`}>{score}</span>
                                                                    <span className="text-[10px] text-slate-400 font-semibold">/10</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`w-full text-center py-2 rounded-lg text-xs font-bold ${c.bg} ${c.text} border ${c.border}`}>
                                                        {scoreLabel}
                                                    </div>
                                                </div>

                                                {/* Metrics grid */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { label: 'Activités',     value: clientActivities.length, icon: ClockIcon,         color: 'text-sky-500',    bg: 'bg-sky-50'    },
                                                        { label: 'Projets',       value: clientProjets.length,    icon: BriefcaseIcon,     color: 'text-violet-500', bg: 'bg-violet-50' },
                                                        { label: 'Devis',         value: clientDevis.length,      icon: DocumentTextIcon,  color: 'text-amber-500',  bg: 'bg-amber-50'  },
                                                        { label: 'Facteurs IA',   value: (satisfaction.factors || []).length, icon: ChartBarIcon, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                                    ].map(m => (
                                                        <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                                                            <div className={`h-9 w-9 rounded-xl ${m.bg} flex items-center justify-center flex-shrink-0`}>
                                                                <m.icon className={`h-4 w-4 ${m.color}`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{m.label}</p>
                                                                <p className="text-xl font-bold text-slate-700 leading-tight">{m.value}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ── Factors ── */}
                                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                                                    <ChartBarIcon className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Facteurs d'impact identifiés</span>
                                                    <span className="ml-auto text-[10px] text-slate-400">{(satisfaction.factors || []).length} facteur{(satisfaction.factors || []).length !== 1 ? 's' : ''}</span>
                                                </div>
                                                {(!satisfaction.factors || satisfaction.factors.length === 0) ? (
                                                    <div className="py-10 text-center text-sm text-slate-400">Aucun facteur détecté à ce stade</div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100">
                                                        {satisfaction.factors.map((factor, idx) => {
                                                            const pos = factor.impact >= 0;
                                                            return (
                                                                <div key={idx} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${pos ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                                                        {pos
                                                                            ? <ArrowUpRightIcon className="h-4 w-4 text-emerald-600" />
                                                                            : <ChevronDownIcon  className="h-4 w-4 text-rose-600" />
                                                                        }
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-slate-800">{factor.factor}</p>
                                                                        {factor.desc && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{factor.desc}</p>}
                                                                    </div>
                                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${pos ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                                        {pos ? '+' : ''}{factor.impact}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            </>
                                        );
                                    })()}
                                </div>
                                    )}

                                    {activeTab === 'reglements' && (
                                        <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                                <BanknotesIcon className="h-7 w-7 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">Historique des règlements</p>
                                                <p className="text-xs text-slate-400 mt-1">Consultez tous les paiements et encaissements de ce client</p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/clients/${id}/reglements`)}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
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
    );
};

export default ClientDetail;