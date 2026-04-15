import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    ClockIcon,
    UserIcon,
    DocumentTextIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    CalendarIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ChevronRightIcon,
    ArrowPathIcon,
    WrenchScrewdriverIcon,
    PaperAirplaneIcon,
    ChartBarIcon,
    EyeIcon,
    HashtagIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import api from '../../app/axios';
import useAuth from '../../hooks/useAuth';

const statusConfig = {
    'Ouverte': { label: 'Ouverte', color: 'bg-amber-500/15 text-amber-600 border-amber-500/20' },
    'En cours': { label: 'En cours', color: 'bg-blue-500/15 text-blue-600 border-blue-500/20' },
    'Résolu': { label: 'Résolu', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' },
    'Fermée': { label: 'Fermée', color: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/20' },
};

const priorityConfig = {
    'Basse': { label: 'Basse', color: 'text-zinc-500' },
    'Normale': { label: 'Normale', color: 'text-blue-500' },
    'Haute': { label: 'Haute', color: 'text-amber-500' },
    'Urgente': { label: 'Urgente', color: 'text-red-500' },
};

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

const ClaimDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [claim, setClaim] = useState(null);
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const { isAdmin, isTechnicien, isClient } = useAuth();
    const userIsAdmin = isAdmin;
    const userIsTechnicien = isTechnicien;

    useEffect(() => {
        fetchClaim();
    }, [id]);

    const fetchClaim = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/reclamations/${id}`);
            console.log('Réponse API:', response.data);
            
            // La réponse peut être dans response.data ou response.data.data
            const claimData = response.data.data || response.data;
            setClaim(claimData);
            // Les interventions sont déjà incluses dans la réponse
            setInterventions(claimData?.interventions || []);
        } catch (error) {
            console.error('Erreur chargement réclamation:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await api.patch(`/reclamations/${id}`, { Statut: newStatus });
            fetchClaim();
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
        }
    };

    const isClosed = claim?.Statut === 'Résolu' || claim?.Statut === 'Fermée';
    const status = statusConfig[claim?.Statut] || { label: claim?.Statut || 'Inconnu', color: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/20' };
    const priority = priorityConfig[claim?.Priorite] || { label: 'Normale', color: 'text-blue-500' };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-sm text-slate-500">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!claim) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <DocumentTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">Réclamation non trouvée</h2>
                    <button
                        onClick={() => navigate('/claims')}
                        className="text-sky-600 hover:text-sky-700 font-medium"
                    >
                        Retour à la liste
                    </button>
                </div>
            </div>
        );
    }

    const navTabs = [
        { id: 'overview', label: 'Vue générale' },
        { id: 'activity', label: 'Activité' },
        { id: 'interventions', label: 'Interventions' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header sticky */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="flex h-14 items-center justify-between px-4 md:px-6">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/claims')}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                        </button>
                        
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <span 
                                className="text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                                onClick={() => navigate('/claims')}
                            >
                                Réclamations
                            </span>
                            <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400/40" />
                            <span className="font-mono font-medium">{claim.NumTicket || `#${claim.ID}`}</span>
                        </div>

                        <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${status.color}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {status.label}
                        </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={fetchClaim}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>

                        {(userIsAdmin || userIsTechnicien) && !isClosed && (
                            <button
                                onClick={() => handleStatusUpdate('Résolu')}
                                className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors text-xs font-medium"
                            >
                                <PaperAirplaneIcon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Marquer Résolu</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Secondary Nav: Tabs */}
                <div className="flex items-center gap-0 px-4 md:px-6">
                    {navTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative px-3 md:px-4 py-3 text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'text-slate-800 font-medium'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
                {/* Title Section */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-mono text-xs h-6 px-2.5 bg-slate-100 rounded flex items-center">
                            <HashtagIcon className="h-3 w-3 mr-1 text-slate-500" />
                            {claim.NumTicket || `RM${claim.ID}`}
                        </span>
                        <span className="px-2.5 h-6 rounded border border-slate-200 flex items-center text-xs">
                            <TagIcon className="h-3 w-3 mr-1.5 text-slate-500" />
                            {claim.Categorie || 'N/A'}
                        </span>
                        <span className={`text-xs font-medium ${priority.color}`}>
                            Priorité {priority.label}
                        </span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2">
                        {claim.Objet}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Ouvert le {formatDate(claim.DateOuverture)} - Dernière mise à jour le {formatDate(claim.DateModification)}
                    </p>
                </div>

                {/* Quick Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    {[
                        { label: 'Ouvert depuis', value: `${Math.ceil((new Date() - new Date(claim.DateOuverture)) / (1000 * 60 * 60 * 24))} jours`, icon: ClockIcon, color: 'text-slate-500' },
                        { label: 'SLA Restant', value: claim.DelaiTraitement || 'N/A', icon: ExclamationTriangleIcon, color: 'text-amber-500' },
                        { label: 'Interventions', value: interventions.length, icon: WrenchScrewdriverIcon, color: 'text-slate-500' },
                        { label: 'Progression', value: isClosed ? '100%' : `${Math.round((interventions.length / 3) * 100)}%`, icon: ChartBarIcon, color: 'text-emerald-500' },
                    ].map((stat, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 md:p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500">{stat.label}</span>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                            <p className="text-lg md:text-xl font-semibold tabular-nums text-slate-800">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Description */}
                        <section className="rounded-lg border border-slate-200 bg-white">
                            <div className="px-4 md:px-5 py-4 border-b border-slate-200">
                                <h2 className="text-sm font-medium text-slate-800">Description</h2>
                            </div>
                            <div className="px-4 md:px-5 py-4">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {claim.Description || 'Aucune description fournie'}
                                </p>
                            </div>
                        </section>

                        {/* Interventions */}
                        <section className="rounded-lg border border-slate-200 bg-white">
                            <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-slate-200">
                                <h2 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                    <WrenchScrewdriverIcon className="h-4 w-4 text-slate-500" />
                                    Interventions
                                </h2>
                                <button
                                    onClick={() => navigate(`/claims/${id}/intervention/new`)}
                                    className="h-7 px-3 text-xs rounded border border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    Planifier
                                </button>
                            </div>

                            {interventions.length > 0 ? (
                                <div className="divide-y divide-slate-200">
                                    {interventions.map((intervention) => (
                                        <div key={intervention.ID} className="px-4 md:px-5 py-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                                                        intervention.Statut === 'Terminée' 
                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                            : 'bg-amber-500/10 text-amber-600'
                                                    }`}>
                                                        {intervention.Statut === 'Terminée' ? (
                                                            <CheckCircleIcon className="h-4 w-4" />
                                                        ) : (
                                                            <ClockIcon className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{intervention.Type || 'Intervention'}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatDate(intervention.DateIntervention)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded text-xs border ${
                                                    intervention.Statut === 'Terminée'
                                                        ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                                                        : 'border-amber-500/30 text-amber-600 bg-amber-500/10'
                                                }`}>
                                                    {intervention.Statut || 'En cours'}
                                                </span>
                                            </div>

                                            {intervention.Description && (
                                                <p className="text-sm text-slate-600 mb-2 ml-12">{intervention.Description}</p>
                                            )}

                                            <div className="flex items-center justify-between text-xs text-slate-500 ml-12">
                                                <span className="flex items-center gap-1.5">
                                                    <UserIcon className="h-3 w-3" />
                                                    {intervention.NomTechnicien || 'Non assigné'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 md:px-5 py-12 text-center">
                                    <WrenchScrewdriverIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">Aucune intervention planifiée</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Assignee Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-slate-800">Agent assigné</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                        {claim.NomTechnicien?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                    </div>
                                    {claim.Statut === 'En cours' && (
                                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{claim.NomTechnicien || 'Non assigné'}</p>
                                    <p className="text-xs text-slate-500">Technicien</p>
                                </div>
                            </div>
                        </div>

                        {/* Client Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                            <span className="text-sm font-medium text-slate-800 block mb-4">Client</span>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                                    {(claim.LibTiers || claim.CodTiers)?.substring(0, 2).toUpperCase() || 'C'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{claim.LibTiers || claim.CodTiers}</p>
                                    <p className="text-xs text-slate-500">Client</p>
                                </div>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                            <span className="text-sm font-medium text-slate-800 block mb-4">Détails</span>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2.5">
                                    <CalendarIcon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Date d'ouverture</p>
                                        <p className="text-sm font-medium text-slate-800">{formatDate(claim.DateOuverture)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <MapPinIcon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Localisation</p>
                                        <p className="text-sm text-slate-800">{claim.Localisation || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                            <span className="text-sm font-medium text-slate-800 block mb-4">Actions rapides</span>
                            <div className="grid grid-cols-2 gap-2">
                                {(userIsAdmin || userIsTechnicien) && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/claims/${id}/intervention/new`)}
                                            className="h-9 px-3 text-xs justify-start gap-2 font-normal rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center"
                                        >
                                            <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-slate-500" />
                                            Intervention
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('En cours')}
                                            className="h-9 px-3 text-xs justify-start gap-2 font-normal rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center"
                                        >
                                            <ArrowPathIcon className="h-3.5 w-3.5 text-slate-500" />
                                            Mettre à jour
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => navigate('/claims')}
                                    className="h-9 px-3 text-xs justify-start gap-2 font-normal rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center"
                                >
                                    <EyeIcon className="h-3.5 w-3.5 text-slate-500" />
                                    Voir liste
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClaimDetail;
