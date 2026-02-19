import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PlusIcon,
    ChatBubbleLeftEllipsisIcon,
    ClockIcon,
    CheckCircleIcon,
    WrenchScrewdriverIcon,
    UserCircleIcon,
    CalendarIcon,
    ExclamationCircleIcon,
    UserPlusIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

const ClaimDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [claim, setClaim] = useState(null);
    const [assigning, setAssigning] = useState(false);

    // Mock techniciens pour la démonstration
    const TECHNICIENS = [
        { id: 101, name: 'Sami Technicien' },
        { id: 102, name: 'Amine Expert' },
        { id: 103, name: 'Youssef Maintenance' }
    ];

    useEffect(() => {
        // Simulation chargement depuis API
        setTimeout(() => {
            setClaim({
                NumBon: id,
                DateBon: new Date().toISOString(),
                CodTiers: 'CLI001',
                LibTiers: 'Société ABC',
                Objet: 'Problème réseau après installation',
                Description: 'Depuis l installation de la nouvelle baie informatique mardi dernier, nous constatons des micro-coupures sur le réseau local. Le serveur de fichiers est inaccessible par intermittence.',
                Statut: 'Ouvert',
                Priorite: 'Haute',
                IDTechnicien: null,
                NomTechnicien: 'Non assigné',
                TypeReclamation: 'Technique'
            });
            setLoading(false);
        }, 800);
    }, [id]);

    const handleAssign = (tech) => {
        setAssigning(true);
        // Simulation API PUT /api/reclamations/:id/assign
        setTimeout(() => {
            setClaim(prev => ({
                ...prev,
                IDTechnicien: tech.id,
                NomTechnicien: tech.name,
                Statut: 'En cours'
            }));
            toast.success(`Affecté à ${tech.name}`);
            setAssigning(false);
        }, 1000);
    };

    const handleStatusUpdate = (newStatus) => {
        // Simulation API PUT /api/reclamations/:id/status
        setClaim(prev => ({ ...prev, Statut: newStatus }));
        toast.success(`Statut mis à jour : ${newStatus}`);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-6 max-w-6xl mx-auto pb-12">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/claims')}
                    className="flex items-center text-gray-500 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 font-bold text-sm"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-1" />
                    Retour aux réclamations
                </button>
                <div className="flex gap-2">
                    {claim.Statut !== 'Résolu' && (
                        <button
                            onClick={() => handleStatusUpdate('Résolu')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <CheckCircleIcon className="h-4 w-4" /> Marquer comme Résolu
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-mono text-xs font-bold">
                                    Ticket: {claim.NumBon}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${claim.Priorite === 'Urgente' ? 'bg-red-100 text-red-700' :
                                    claim.Priorite === 'Haute' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-primary-700'
                                    }`}>
                                    Priorité {claim.Priorite}
                                </span>
                            </div>

                            <h1 className="text-3xl font-black text-slate-800 mb-2 leading-tight">
                                {claim.Objet}
                            </h1>
                            <p className="text-gray-500 font-medium mb-8 flex items-center gap-2">
                                <UserCircleIcon className="h-5 w-5 text-primary-400" />
                                Client : <span className="text-slate-800 font-bold">{claim.LibTiers}</span>
                            </p>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ChatBubbleLeftEllipsisIcon className="h-4 w-4" /> Description du problème
                                </h3>
                                <p className="text-gray-700 leading-relaxed font-medium">
                                    {claim.Description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / History Simulation */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-gray-50 pb-4">Activité du Ticket</h3>
                        <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-gray-50">
                            <div className="relative pl-10">
                                <span className="absolute left-0 top-0 h-8 w-8 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center ring-4 ring-white">
                                    <PlusIcon className="h-4 w-4" />
                                </span>
                                <p className="text-sm font-bold text-slate-800 leading-none">Ticket créé par le système</p>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(claim.DateBon)}</p>
                            </div>
                            {claim.NomTechnicien !== 'Non assigné' && (
                                <div className="relative pl-10">
                                    <span className="absolute left-0 top-0 h-8 w-8 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center ring-4 ring-white">
                                        <WrenchScrewdriverIcon className="h-4 w-4" />
                                    </span>
                                    <p className="text-sm font-bold text-slate-800 leading-none">Affecté au technicien : {claim.NomTechnicien}</p>
                                    <p className="text-xs text-gray-500 mt-1">Aujourd'hui, à l'instant</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Status & Assignment Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="mb-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Statut Actuel</p>
                            <div className={`p-4 rounded-2xl flex items-center gap-3 ${claim.Statut === 'Résolu' ? 'bg-green-50 text-green-700 border border-green-100' :
                                claim.Statut === 'En cours' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                    'bg-primary-50 text-primary-700 border border-blue-100'
                                }`}>
                                {claim.Statut === 'Résolu' ? <CheckCircleIcon className="h-6 w-6" /> :
                                    claim.Statut === 'En cours' ? <WrenchScrewdriverIcon className="h-6 w-6" /> :
                                        <ExclamationCircleIcon className="h-6 w-6" />}
                                <span className="text-lg font-black">{claim.Statut}</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Affectation Technicien</p>
                            {claim.NomTechnicien !== 'Non assigné' ? (
                                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3 border border-gray-100">
                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                                        <UserCircleIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{claim.NomTechnicien}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Technicien en intervention</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 border border-red-100 text-red-600">
                                    <ExclamationCircleIcon className="h-6 w-6" />
                                    <span className="text-xs font-bold">Non assigné</span>
                                </div>
                            )}
                        </div>

                        {/* Assignment Section */}
                        {claim.Statut !== 'Résolu' && (
                            <div className="mt-8 pt-6 border-t border-gray-50">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                                    <UserPlusIcon className="h-3 w-3" /> Affecter un Technicien
                                </p>
                                <div className="space-y-2">
                                    {TECHNICIENS.map(tech => (
                                        <button
                                            key={tech.id}
                                            onClick={() => handleAssign(tech)}
                                            disabled={assigning}
                                            className="w-full p-3 text-left bg-white border border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center justify-between group"
                                        >
                                            <span className="text-xs font-bold text-gray-600 group-hover:text-primary-700">{tech.name}</span>
                                            <div className="h-2 w-2 rounded-full bg-gray-200 group-hover:bg-primary-500"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-slate-800 rounded-3xl shadow-xl p-6 text-white text-sm">
                        <h3 className="font-bold mb-4 opacity-50 uppercase tracking-widest text-[10px]">Information Système</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="opacity-60 flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Ouverture</span>
                                <span className="font-bold">{formatDate(claim.DateBon)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="opacity-60 flex items-center gap-2"><TagIcon className="h-4 w-4" /> Type</span>
                                <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-[10px]">{claim.TypeReclamation}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimDetail;
