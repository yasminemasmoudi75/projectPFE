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
    ChevronDownIcon
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
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Professional Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/clients')}
                        className="h-12 w-12 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:from-blue-50 hover:to-blue-100 rounded-2xl shadow-soft flex items-center justify-center transition-all duration-300"
                    >
                        <ArrowLeftIcon className="h-5 w-5 stroke-[2.5]" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{client.LibTiers}</h1>
                            <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-700 text-xs font-extrabold uppercase tracking-wider rounded-full shadow-sm">
                                {client.Type}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-black">Réf. {client.CodTiers}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                            <span><MapPinIcon className="h-3.5 w-3.5 inline mr-1 text-slate-400" />{client.Ville || 'Ville non renseignée'}, {client.Pays || 'Tunisie'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/clients/edit/${id}`)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:border-blue-300 hover:text-blue-600 hover:shadow-soft transition-all duration-300"
                    >
                        <PencilIcon className="h-4 w-4 inline mr-2" />
                        Éditer Fiche
                    </button>
                    <button
                        onClick={() => navigate('/devis/new')}
                        className="btn-soft-primary flex items-center gap-2 rounded-2xl px-6 py-3"
                    >
                        <PlusIcon className="h-5 w-5 stroke-[3]" />
                        <span>Nouveau Devis</span>
                    </button>
                </div>
            </div>

            {/* Professional Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card-luxury p-7 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 hover:border-blue-200">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">{stat.value}</p>
                            </div>
                            <div className={`${stat.gradient} rounded-2xl p-3 shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="card-luxury p-0 overflow-hidden border border-slate-100 hover:border-blue-200 transition-all duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center text-blue-700 border border-blue-200 shadow-soft">
                                <IdentificationIcon className="h-5 w-5" />
                            </div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Fiche Identité</h3>
                        </div>
                        <div className="p-8 space-y-7">
                            {[
                                { icon: PhoneIcon, label: 'Ligne Directe', value: client.Tel },
                                { icon: EnvelopeIcon, label: 'Emailing / Facturation', value: client.Email },
                                { icon: MapPinIcon, label: 'Siège Social', value: `${client.Adresse || '—'}, ${client.Cp || client.CodePostal || '—'} ${client.Ville || '—'}` },
                                { icon: IdentificationIcon, label: 'Identifiant Fiscal', value: client.CodTva || client.MatriculeFiscale },
                                { icon: UserCircleIcon, label: 'Commercial Assigné', value: client.codRepresTiers || client.Commercial },
                            ].map((item, i) => (
                                <div key={i} className="group cursor-default hover:bg-blue-50/40 p-4 rounded-xl transition-all duration-300">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">{item.label}</p>
                                    <div className="flex items-start gap-4">
                                        <div className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 group-hover:text-blue-700 transition-colors">
                                            <item.icon className="h-full w-full" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 leading-tight group-hover:text-slate-900 transition-all">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card-luxury p-0 overflow-hidden border border-slate-100 hover:border-emerald-200 transition-all duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50">
                            <div className="h-10 w-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-emerald-700 border border-emerald-200 shadow-soft">
                                <UserGroupIcon className="h-5 w-5" />
                            </div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Contacts & Adresses</h3>
                        </div>
                        <div className="p-8 space-y-8">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Contacts</p>
                                    <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">{contacts.length}</span>
                                </div>
                                {contacts.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Aucun contact enregistré</p>
                                ) : (
                                    <div className="space-y-3">
                                        {contacts.map((contact, index) => (
                                            <div key={`contact-${index}`} className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/30 to-teal-50/30 p-4 hover:border-emerald-200 hover:shadow-soft transition-all duration-300">
                                                <p className="text-sm font-bold text-slate-800 mb-1">{contact.Responsable || '—'}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-2"><PhoneIcon className="h-3 w-3" />{contact.Tel || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Adresses</p>
                                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold">{addresses.length}</span>
                                </div>
                                {addresses.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Aucune adresse enregistrée</p>
                                ) : (
                                    <div className="space-y-3">
                                        {addresses.map((address, index) => (
                                            <div key={`address-${index}`} className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/30 to-cyan-50/30 p-4 hover:border-blue-200 hover:shadow-soft transition-all duration-300">
                                                <p className="text-sm font-bold text-slate-800 flex items-start gap-2"><MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />{address.Adresse || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Activities/Tabs Area */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="card-luxury p-0 flex-1 flex flex-col overflow-hidden border border-slate-100 hover:border-slate-200 transition-all duration-300">
                        {/* Professional Tabs */}
                        <div className="flex border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
                            {[
                                { id: 'infos', label: 'Infos Complètes' },
                                { id: 'activities', label: 'Journal Activités' },
                                { id: 'devis', label: 'Documents Devis' },
                                { id: 'projets', label: 'Suivi Projets' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-8 py-4 text-[11px] font-bold uppercase tracking-wider transition-all relative group ${activeTab === tab.id
                                        ? 'text-blue-700 bg-blue-50/50'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-8 right-8 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-t-full shadow-lg shadow-blue-300/30"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Professional Panel Content */}
                        <div className="p-8 flex-1 bg-white/50">
                            {activeTab === 'infos' && (
                                <div className="space-y-4">
                                    {infoSections.map((section) => {
                                        const isExpanded = expandedSections[section.id];

                                        return (
                                            <div key={section.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all duration-300">
                                                <button
                                                    onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 bg-gradient-to-r from-slate-50 to-slate-100"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-9 w-9 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50/50">
                                                            <section.icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">{section.title}</h4>
                                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{section.fields.length} champs</p>
                                                        </div>
                                                    </div>
                                                    <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-6 py-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {section.fields.map(([label, value]) => {
                                                            const hasValue = value !== null && value !== undefined && value !== '' && value !== false;
                                                            return (
                                                                <div key={label} className={`py-3 px-4 rounded-xl transition-all duration-200 ${hasValue ? 'bg-blue-50/40 border border-blue-100 hover:border-blue-200' : 'bg-slate-50/40'}`}>
                                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">{label}</p>
                                                                    <p className={`text-sm font-semibold ${hasValue ? 'text-slate-800' : 'text-slate-400 italic'}`}>
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
                                <div className="space-y-4">
                                    {loadingActivities ? (
                                        <div className="flex justify-center py-10 text-xs text-slate-400">
                                            Chargement du journal d'activités...
                                        </div>
                                    ) : activitiesError ? (
                                        <p className="text-xs text-rose-500">{activitiesError}</p>
                                    ) : clientActivities.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                            <div className="h-20 w-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                                                <ClockIcon className="h-10 w-10 text-slate-300" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune activité liée</p>
                                        </div>
                                    ) : (
                                        clientActivities.map((activity) => {
                                            const date = activity.Date_Activite ? new Date(activity.Date_Activite) : null;
                                            return (
                                                <div key={activity.ID_Activite} className="flex items-center gap-6 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                                                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-gradient-blue group-hover:text-white transition-all shadow-sm">
                                                        {activity.Type_Activite === 'Appel' ? <PhoneIcon className="h-5 w-5" /> : <EnvelopeIcon className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-extrabold text-slate-800">{activity.Type_Activite}</span>
                                                            {date && (
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    {date.toLocaleDateString('fr-FR')} • {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-semibold text-slate-500 line-clamp-1">{activity.Description || 'Aucune description'}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(`/activites/${activity.ID_Activite}`, {
                                                                state: { fromClientId: client.IDTiers },
                                                            })
                                                        }
                                                        className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
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
                                        className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-500 transition-all"
                                    >
                                        Consigner une nouvelle interaction
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
                                <div className="space-y-4">
                                    {loadingProjets ? (
                                        <div className="flex justify-center py-10 text-xs text-slate-400">
                                            Chargement des projets...
                                        </div>
                                    ) : projetsError ? (
                                        <p className="text-xs text-rose-500">{projetsError}</p>
                                    ) : clientProjets.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                            <div className="h-16 w-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-4 text-blue-500 border border-blue-100">
                                                <BriefcaseIcon className="h-8 w-8" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aucun projet lié</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase">Créez un projet depuis le module Projets</p>
                                        </div>
                                    ) : (
                                        clientProjets.map((projet) => (
                                            <div
                                                key={projet.ID_Projet}
                                                className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-soft transition-all group cursor-pointer"
                                                onClick={() =>
                                                    navigate(`/projets/${projet.ID_Projet}`, {
                                                        state: { fromClientId: client.IDTiers },
                                                    })
                                                }
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-11 w-11 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-gradient-blue group-hover:text-white transition-all">
                                                        <BriefcaseIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-extrabold text-slate-800 tracking-tight line-clamp-1">
                                                            {projet.Nom_Projet}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                            {projet.Phase || 'Phase non définie'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <span className="text-sm font-black text-slate-800 w-24 text-right">
                                                        {formatCurrency(projet.Budget_Alloue || 0)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {projet.Date_Echeance ? formatDate(projet.Date_Echeance) : 'Sans échéance'}
                                                    </span>
                                                    <div className="p-2 text-slate-300 group-hover:text-blue-600 transition-colors">
                                                        <ArrowUpRightIcon className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Bottom Action Bar */}
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100/50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase px-8">
                            <span>Fiche certifiée par Système CRM</span>
                            <span className="flex items-center gap-1"><SparklesIcon className="h-3.5 w-3.5 text-blue-500" /> Nexus Engnine V1.2</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetail;
