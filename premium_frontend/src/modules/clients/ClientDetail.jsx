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
    ArrowUpRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [activeTab, setActiveTab] = useState('activities');
    const [clientActivities, setClientActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [activitiesError, setActivitiesError] = useState(null);
    const [clientProjets, setClientProjets] = useState([]);
    const [loadingProjets, setLoadingProjets] = useState(false);
    const [projetsError, setProjetsError] = useState(null);

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

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/clients')}
                        className="h-11 w-11 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-xl shadow-soft flex items-center justify-center transition-all"
                    >
                        <ArrowLeftIcon className="h-5 w-5 stroke-[2.5]" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{client.LibTiers}</h1>
                            <span className="badge badge-primary py-1 px-3">
                                {client.Type}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                            <span className="font-extrabold text-blue-500">#{client.CodTiers}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                            <span>{client.Ville}, Tunisie</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/clients/edit/${id}`)}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all shadow-soft"
                    >
                        Éditer Fiche
                    </button>
                    <button
                        onClick={() => navigate('/devis/new')}
                        className="btn-soft-primary flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4 stroke-[3]" />
                        Créer un Devis
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card-luxury p-6 group hover:-translate-y-1 transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors">{stat.value}</p>
                            </div>
                            <div className={`icon-shape icon-shape-sm ${stat.gradient} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 flex items-center gap-3 bg-slate-50/30">
                            <div className="h-9 w-9 bg-white shadow-soft rounded-xl flex items-center justify-center text-blue-600 border border-slate-100">
                                <IdentificationIcon className="h-5 w-5" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Fiche Identité</h3>
                        </div>
                        <div className="p-8 space-y-8">
                            {[
                                { icon: PhoneIcon, label: 'Ligne Directe', value: client.Tel },
                                { icon: EnvelopeIcon, label: 'Emailing / Facturation', value: client.Email },
                                { icon: MapPinIcon, label: 'Siège Social', value: `${client.Adresse}, ${client.CodePostal} ${client.Ville}` },
                                { icon: IdentificationIcon, label: 'Identifiant Fiscal', value: client.MatriculeFiscale },
                                { icon: UserCircleIcon, label: 'Commercial Assisgné', value: client.Commercial },
                            ].map((item, i) => (
                                <div key={i} className="group cursor-default">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                                    <div className="flex items-start gap-3">
                                        <div className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5 group-hover:text-blue-600 transition-colors">
                                            <item.icon className="h-full w-full" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-blue-600 transition-all">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card-luxury p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-none shadow-xl relative overflow-hidden text-white">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="p-2.5 bg-gradient-blue rounded-xl shadow-glow-blue">
                                    <SparklesIcon className="h-5 w-5 text-white" />
                                </span>
                                <h4 className="text-xs font-bold uppercase tracking-widest">Confiance & Engagement</h4>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Partenaire Stratégique</p>
                                <p className="text-[11px] text-white/50 leading-relaxed font-medium">Audit annuel réalisé avec succès le {new Date(client.DateCreation).toLocaleDateString()}. Profil de risque faible.</p>
                            </div>
                        </div>
                        <div className="absolute bottom-[-20%] right-[-10%] h-48 w-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                    </div>
                </div>

                {/* Main Activities/Tabs Area */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="card-luxury p-0 flex-1 flex flex-col overflow-hidden">
                        {/* Custom Tabs */}
                        <div className="flex border-b border-slate-100/50 bg-slate-50/20">
                            {[
                                { id: 'activities', label: 'Journal Activités' },
                                { id: 'devis', label: 'Documents Devis' },
                                { id: 'projets', label: 'Suivi Projets' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-8 py-5 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id
                                        ? 'text-blue-600'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-blue rounded-t-full shadow-glow-blue"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Panel Content */}
                        <div className="p-8 flex-1 bg-white">
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
