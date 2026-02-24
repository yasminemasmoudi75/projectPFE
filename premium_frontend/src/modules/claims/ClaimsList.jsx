import { useState, useEffect } from 'react';
import {
    PlusIcon,
    FunnelIcon,
    ChatBubbleLeftEllipsisIcon,
    ClockIcon,
    CheckCircleIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import axios from '../../app/axios';
import toast from 'react-hot-toast';

const ClaimsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [claims, setClaims] = useState([]);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/reclamations');
                const list = response?.data ?? response ?? [];
                const mapped = (Array.isArray(list) ? list : []).map((rec) => ({
                    id: rec.ID,
                    ticket: rec.NumTicket,
                    client: rec.LibTiers || rec.CodTiers || 'Client non défini',
                    object: rec.Objet || 'Sans objet',
                    date: rec.DateOuverture || rec.createdAt,
                    priority: rec.Priorite || 'Moyenne',
                    status: rec.Statut || 'Ouvert',
                    assignedTo: rec.NomTechnicien || 'Non assigné'
                }));
                setClaims(mapped);
            } catch (error) {
                console.error('Error fetching reclamations:', error);
                toast.error('Impossible de charger les réclamations');
            } finally {
                setLoading(false);
            }
        };

        fetchClaims();
    }, []);

    const stats = claims.reduce(
        (acc, claim) => {
            const status = String(claim.status || '').toLowerCase();
            const priority = String(claim.priority || '').toLowerCase();

            if (status === 'résolu' || status === 'resolu') acc.resolved += 1;
            if (status === 'en cours') acc.inProgress += 1;
            if (status === 'ouvert' || status === 'nouveau') acc.new += 1;
            if (priority === 'urgente' || status === 'urgent') acc.urgent += 1;

            return acc;
        },
        { new: 0, inProgress: 0, urgent: 0, resolved: 0 }
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-black tracking-tight">Réclamations & SAV</h1>
                    <p className="text-sm text-gray-500 mt-1">Suivez les tickets de support et assurez la satisfaction client</p>
                </div>
                <button
                    onClick={() => navigate('/claims/new')}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 font-black text-sm"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Ouvrir un Ticket
                </button>
            </div>

            {/* Grid of Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { name: 'Nouveaux', count: stats.new, color: 'bg-primary-50 text-primary-700 border-blue-100', icon: ChatBubbleLeftEllipsisIcon },
                    { name: 'En cours', count: stats.inProgress, color: 'bg-orange-50 text-orange-700 border-orange-100', icon: WrenchScrewdriverIcon },
                    { name: 'Urgents', count: stats.urgent, color: 'bg-red-50 text-red-700 border-red-100', icon: ClockIcon },
                    { name: 'Résolus', count: stats.resolved, color: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircleIcon },
                ].map((item) => (
                    <div key={item.name} className={`p-5 rounded-3xl border ${item.color} flex items-center justify-between shadow-sm transition-transform hover:scale-[1.02] cursor-default`}>
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/50 rounded-xl">
                                <item.icon className="h-6 w-6" />
                            </div>
                            <span className="font-black uppercase tracking-widest text-[10px]">{item.name}</span>
                        </div>
                        <span className="text-3xl font-black">{item.count}</span>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Tickets de support Récents</h3>
                    <button className="text-[10px] font-black uppercase text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 border border-primary-100">
                        <FunnelIcon className="h-3 w-3" />
                        Filtrer la liste
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/20">
                                <th className="px-8 py-5">N° Ticket</th>
                                <th className="px-8 py-5">Client & Objet du problème</th>
                                <th className="px-8 py-5">Niveau Priorité</th>
                                <th className="px-8 py-5">Technicien Affecté</th>
                                <th className="px-8 py-5">État Statut</th>
                                <th className="px-8 py-5 text-right">Date de prise</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {claims.map((claim) => (
                                <tr
                                    key={claim.id}
                                    onClick={() => navigate(`/claims/${claim.id}`)}
                                    className="hover:bg-primary-50/30 transition-all cursor-pointer group"
                                >
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className="font-mono text-[10px] font-black bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-sm group-hover:bg-primary-600 transition-colors">{claim.ticket}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-black text-slate-800 mb-0.5">{claim.client}</div>
                                        <div className="text-xs text-gray-400 font-medium truncate max-w-xs">{claim.object}</div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${claim.priority === 'Urgente' || claim.priority === 'Urgent' ? 'bg-red-50 text-red-600 border border-red-100' :
                                            claim.priority === 'Haute' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                'bg-gray-50 text-gray-500 border border-gray-200'
                                            }`}>
                                            {claim.priority}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 bg-gray-100 rounded-full flex items-center justify-center">
                                                <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-gray-400" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-600">{claim.assignedTo}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${claim.status === 'Résolu' ? 'bg-green-500 text-white shadow-lg shadow-green-200' :
                                            claim.status === 'En cours' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                                                claim.status === 'Nouveau' ? 'bg-primary-500 text-white shadow-lg shadow-primary-200' :
                                                    'bg-red-500 text-white shadow-lg shadow-red-200'
                                            }`}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right whitespace-nowrap text-[11px] text-gray-400 font-black">
                                        {formatDate(claim.date)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClaimsList;
