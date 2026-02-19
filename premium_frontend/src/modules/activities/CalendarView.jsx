import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
    CalendarIcon,
    ClockIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    EyeIcon,
    PencilIcon,
    MapPinIcon,
    BanknotesIcon,
    ShieldCheckIcon,
    TagIcon,
    IdentificationIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    StarIcon,
    BellIcon,
    AdjustmentsHorizontalIcon,
    FunnelIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

const MOCK_EVENTS = [
    {
        id: 1,
        title: 'Réunion Société ABC',
        date: '2026-02-06',
        time: '14:30',
        type: 'Réunion',
        priority: 'Haute',
        company: 'Société ABC',
        clientId: '1',
        project: 'Extension Infrastructure Cloud',
        contact: 'M. Slim Ben Amar',
        email: 'contact@abc.com',
        phone: '+216 71 000 001',
        city: 'Tunis',
        address: '15 Rue de l\'Indépendance',
        commercial: 'Ahmed',
        solde: '4,500.000 DT',
        status: 'Client Fidèle',
        mf: '1234567/A/M/000',
        paymentTerms: '30 jours fin de mois',
        lastActivity: 'Facture payée le 15/01/2026',
        desc: 'Discussion sur l\'architecture finale et le devis technique.'
    },
    {
        id: 2,
        title: 'Appel Suivi TechSol',
        date: '2026-02-06',
        time: '11:00',
        type: 'Appel',
        priority: 'Moyenne',
        company: 'Tech Solutions',
        clientId: '2',
        project: 'Maintenance Annuelle',
        contact: 'Mme. Ines Karoui',
        email: 'info@techsol.tn',
        phone: '+216 73 111 222',
        city: 'Sousse',
        address: 'Zone Industrielle',
        commercial: 'Sami',
        solde: '1,200.500 DT',
        status: 'Contrat Actif',
        mf: '8877665/B/M/111',
        paymentTerms: 'Chèque à réception',
        lastActivity: 'Devis envoyé le 01/02/2026'
    },
    {
        id: 3,
        title: 'Visite Client Global Import',
        date: '2026-02-08',
        time: '09:00',
        type: 'Visite',
        priority: 'Basse',
        company: 'Global Import',
        clientId: '3',
        project: 'Système SCM Vers. 2.0',
        contact: 'Directeur Logistique',
        email: 'logistique@global.com',
        phone: '+216 71 888 999',
        city: 'Sfax',
        address: 'Port de Sfax',
        commercial: 'Youssef',
        solde: '12,800.000 DT',
        status: 'Gros Compte'
    }
];

const CalendarView = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const days = [];
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const totalDays = daysInMonth(month, year);

    // Padding for calendar grid
    for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
        days.push({ type: 'empty' });
    }

    for (let i = 1; i <= totalDays; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const events = MOCK_EVENTS.filter(e => e.date === dateStr);
        days.push({ type: 'day', number: i, dateStr, events });
    }

    const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 animate-fade-in space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-blue-900 tracking-tight">Gestion des Activités</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" /> Planifiez et suivez vos interventions commerciales
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-200 flex">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-blue-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-blue-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Liste
                        </button>
                    </div>
                    <button
                        onClick={() => navigate('/activites/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all active:scale-95"
                    >
                        <PlusIcon className="h-4 w-4" /> NOUVELLE ACTION
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Left Side - Calendar or Controls */}
                <div className="xl:col-span-3 space-y-6">
                    {viewMode === 'month' ? (
                        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                            {/* Calendar Header Controls */}
                            <div className="p-6 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-black text-blue-900 capitalize italic">{monthName}</h2>
                                    <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                                        <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 hover:bg-gray-50 rounded-lg"><ChevronLeftIcon className="h-4 w-4" /></button>
                                        <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 hover:bg-gray-50 rounded-lg"><ChevronRightIcon className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500"></div><span className="text-[10px] font-black text-gray-400">HAUT</span></div>
                                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary-500"></div><span className="text-[10px] font-black text-gray-400">MOYEN</span></div>
                                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-300"></div><span className="text-[10px] font-black text-gray-400">BAS</span></div>
                                    </div>
                                    <button onClick={() => setCurrentDate(new Date())} className="text-[10px] font-black text-primary-600 hover:underline">AUJOURD'HUI</button>
                                </div>
                            </div>

                            {/* Weekly Header */}
                            <div className="grid grid-cols-7 text-center border-b border-gray-50">
                                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                                    <div key={d} className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
                                ))}
                            </div>

                            {/* The Grid */}
                            <div className="grid grid-cols-7">
                                {days.map((day, i) => (
                                    <div key={i} className={`min-h-[140px] border-r border-b border-gray-50 p-2 relative transition-all ${day.type === 'empty' ? 'bg-gray-50/20' : 'hover:bg-slate-50/50'}`}>
                                        {day.type === 'day' && (
                                            <>
                                                <span className={`text-xs font-black inline-flex items-center justify-center h-7 w-7 rounded-lg ${day.dateStr === new Date().toISOString().split('T')[0] ? 'bg-blue-900 text-white' : 'text-gray-400'}`}>
                                                    {day.number}
                                                </span>
                                                <div className="mt-2 space-y-1">
                                                    {day.events.map(event => (
                                                        <button
                                                            key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            className={`w-full text-left p-2 rounded-xl text-[10px] font-black shadow-sm border-l-4 transition-transform hover:scale-[1.02] ${event.priority === 'Haute' ? 'bg-red-50 text-red-700 border-red-500' :
                                                                    event.priority === 'Moyenne' ? 'bg-primary-50 text-primary-700 border-primary-500' :
                                                                        'bg-slate-50 text-slate-700 border-slate-300'
                                                                }`}
                                                        >
                                                            <div className="truncate">{event.title}</div>
                                                            <div className="text-[9px] opacity-60 mt-0.5">{event.time}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr className="text-left">
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Activité</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Heure</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priorité</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {MOCK_EVENTS.map(event => (
                                        <tr key={event.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-black text-blue-900">{event.title}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{event.type}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                                                        <BuildingOfficeIcon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{event.company}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> {event.date}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5"><ClockIcon className="h-3 w-3" /> {event.time}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${event.priority === 'Haute' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-primary-700'
                                                    }`}>
                                                    {event.priority}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="text-slate-400 hover:text-primary-600 transition-colors"><EyeIcon className="h-5 w-5" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right Side - Details Pane */}
                <div className="xl:col-span-1 space-y-8">
                    {selectedEvent ? (
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-primary-100/50 p-8 border border-white sticky top-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${selectedEvent.priority === 'Haute' ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'
                                    }`}>
                                    {selectedEvent.priority} Priority
                                </span>
                                <button onClick={() => setSelectedEvent(null)} className="text-slate-300 hover:text-red-500 transition-colors"><AdjustmentsHorizontalIcon className="h-6 w-6" /></button>
                            </div>

                            <h2 className="text-2xl font-black text-blue-900 leading-tight mb-2">{selectedEvent.title}</h2>
                            <p className="text-xs font-bold text-slate-400 mb-8 italic">"{selectedEvent.desc || 'No additional notes provided'}"</p>

                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 group">
                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                                        <BuildingOfficeIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-0.5">SOCIÉTÉ</p>
                                        <p className="text-sm font-black text-blue-900 truncate">{selectedEvent.company}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                                        <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><UserIcon className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase underline decoration-orange-300 underline-offset-4">Responsable</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedEvent.contact}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                                        <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center"><PhoneIcon className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase underline decoration-blue-300 underline-offset-4">Direct Contact</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedEvent.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-blue-900 text-white rounded-[24px] font-black text-xs hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3">
                                    <CheckCircleIcon className="h-5 w-5" /> MARQUER COMME TERMINÉ
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12 ">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <BellIcon className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-md font-black text-slate-400 uppercase">Aperçu rapide</h3>
                            <p className="text-xs text-slate-300 mt-2 font-medium">Sélectionnez une activité pour voir les détails ici.</p>
                        </div>
                    )}

                    {/* Activity Feed Section */}
                    <div className="bg-gradient-to-br from-blue-900 to-blue-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                        <h4 className="text-sm font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                            Ligue Commerciale
                        </h4>
                        <div className="space-y-4 relative z-10">
                            {[
                                { name: 'Ahmed', action: 'RDV Validé', icon: CheckCircleIcon },
                                { name: 'Sami', action: 'Appel en cours', icon: ClockIcon },
                            ].map((feed, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center"><feed.icon className="h-4 w-4" /></div>
                                    <p className="text-[10px] font-bold">
                                        <span className="text-blue-300 font-black">{feed.name}</span> {feed.action}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-0 right-0 h-32 w-32 bg-primary-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
