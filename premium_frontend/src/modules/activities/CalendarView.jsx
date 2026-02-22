import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
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
import toast from 'react-hot-toast';

const CalendarView = () => {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);

    // Etas pour le modal de report
    const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
    const [eventToPostpone, setEventToPostpone] = useState(null);
    const [postponeDate, setPostponeDate] = useState('');
    const [postponeTime, setPostponeTime] = useState('');

    // --- LOGIC DE RAPPEL (REMINDER MODAL) ---
    const [reminderModalData, setReminderModalData] = useState([]); // Tableau d'événements à rappeler

    useEffect(() => {
        // Fonction pour vérifier les rappels toutes les minutes
        const checkReminders = () => {
            const now = new Date();
            const newReminders = [];
            
            events.forEach(event => {
                // Ignorer les événements passés, terminés ou annulés
                if (['Terminé', 'Annulé', 'Reporté'].includes(event.status)) return;
                
                // Construire la date complète de l'événement
                const eventDateTime = new Date(`${event.date}T${event.time}`);
                
                // Calculer la différence en minutes
                const diffTime = eventDateTime - now;
                const diffMinutes = Math.floor(diffTime / (1000 * 60));

                // Si l'événement est dans le futur et <= 30 minutes
                if (diffMinutes >= 0 && diffMinutes <= 30) {
                    const reminderKey = `reminder-${event.id}-${event.date}-${event.time}`;
                    
                    // Vérifier si on a déjà notifié pour cet événement dans cette session
                    if (!sessionStorage.getItem(reminderKey)) {
                        newReminders.push({ ...event, minutesLeft: diffMinutes, reminderKey });
                    }
                }
            });

            if (newReminders.length > 0) {
                // Ajouter les nouveaux rappels à la liste existante sans doublons
                setReminderModalData(prev => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const uniqueNewReminders = newReminders.filter(r => !existingIds.has(r.id));
                    return [...prev, ...uniqueNewReminders];
                });

                // Jouer un son (optionnel mais recommandé pour "plus visible")
                try {
                    const audio = new Audio('/src/assets/sounds/notification.mp3'); // Chemin hypothétique, on peut aussi utiliser un URL externe
                    // audio.play().catch(() => {}); // Commenté pour éviter les erreurs si le fichier n'existe pas
                } catch (e) {
                    // Ignorer
                }
            }
        };

        // Vérifier immédiatement puis toutes les minutes
        checkReminders();
        const intervalId = setInterval(checkReminders, 60000); // 60000ms = 1 minute

        return () => clearInterval(intervalId);
    }, [events]); 

    const dismissReminder = (reminder) => {
        // Marquer comme vu dans sessionStorage
        sessionStorage.setItem(reminder.reminderKey, 'true');
        
        // Retirer de la liste
        setReminderModalData(prev => prev.filter(r => r.id !== reminder.id));
    };

    const snoozeReminder = (reminder) => {
        // Snooze pour 5 minutes (ou jusqu'au prochain check si < 5 min)
        // Ici on va juste fermer le modal pour l'instant, mais on ne le marque PAS dans sessionStorage
        // Donc il reviendra à la prochaine vérification (dans 1 minute)
        // Pour un vrai snooze, il faudrait une logique plus complexe avec un timestamp de snooze
        
        // Simplification : on le retire de l'affichage actuel, il reviendra dans 1 minute
        setReminderModalData(prev => prev.filter(r => r.id !== reminder.id));
    };

    // Initialiser selectedUserId avec l'ID de l'utilisateur connecté
    useEffect(() => {
        if (user) {
            setSelectedUserId(user.UserID);
        }
    }, [user]);

    // Fetch users for Admin
    useEffect(() => {
        const fetchUsers = async () => {
            if (isAdmin) {
                try {
                    const response = await axios.get('/users');
                    const usersList = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    setUsers(usersList);
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            }
        };
        fetchUsers();
    }, [isAdmin]);

    useEffect(() => {
        const fetchUserActivities = async () => {
            if (!user || !selectedUserId) return;
            
            setLoading(true);
            try {
                const response = await axios.get('/activites', {
                    params: {
                        userId: selectedUserId
                    }
                });

                const fetchedEvents = (response.data || []).map(activite => ({
                    id: activite.ID_Activite,
                    title: activite.Type_Activite + ' - ' + (activite.tiers?.Raisoc || 'Client inconnu'),
                    date: activite.Date_Activite ? new Date(activite.Date_Activite).toISOString().split('T')[0] : '',
                    time: activite.Date_Activite ? new Date(activite.Date_Activite).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    type: activite.Type_Activite,
                    priority: 'Moyenne',
                    company: activite.tiers?.Raisoc || 'N/A',
                    clientId: activite.IDTiers,
                    project: activite.projet?.Nom_Projet || 'N/A',
                    desc: activite.Description || '',
                    status: activite.Statut,
                    originalData: activite
                }));

                setEvents(fetchedEvents);
            } catch (error) {
                console.error('Error fetching activities:', error);
                toast.error('Erreur lors du chargement des activités');
            } finally {
                setLoading(false);
            }
        };

        fetchUserActivities();
    }, [user, selectedUserId]);

    const handleMonthChange = (e) => {
        const newMonth = parseInt(e.target.value);
        const newDate = new Date(currentDate);
        newDate.setMonth(newMonth);
        setCurrentDate(newDate);
    };

    const handleYearChange = (e) => {
        const newYear = parseInt(e.target.value);
        const newDate = new Date(currentDate);
        newDate.setFullYear(newYear);
        setCurrentDate(newDate);
    };

    const handlePostpone = (event) => {
        if (!event) return;
        setEventToPostpone(event);
        // Pré-remplir avec la date actuelle ou celle de l'événement
        setPostponeDate(event.date || new Date().toISOString().split('T')[0]);
        setPostponeTime(event.time || '09:00');
        setIsPostponeModalOpen(true);
    };

    const confirmPostpone = async () => {
        if (!eventToPostpone || !postponeDate || !postponeTime) {
            toast.error('Veuillez sélectionner une date et une heure');
            return;
        }

        try {
            // 1. API Call: Update original activity status to 'Reporté'
            await axios.put(`/activites/${eventToPostpone.id}`, { Statut: 'Reporté' });

            // 2. API Call: Create duplicated activity with new date
            const originalData = eventToPostpone.originalData || {};
            const newDateTime = `${postponeDate}T${postponeTime}`;

            const newActivityPayload = {
                ID_Utilisateur: originalData.ID_Utilisateur,
                IDTiers: originalData.IDTiers,
                ID_Projet: originalData.ID_Projet,
                Type_Activite: originalData.Type_Activite,
                Description: originalData.Description ? `${originalData.Description} (Reporté)` : 'Activité reportée',
                Date_Activite: newDateTime,
                Statut: 'Planifié'
            };

            const createResponse = await axios.post('/activites', newActivityPayload);
            // The axios interceptor returns response.data directly, so createResponse IS the body { status, data: ... }
            const newActivity = createResponse.data;

            // 3. Update local state (Optimistic + API data)
            // Update original event in list
            setEvents(prevEvents => prevEvents.map(e => 
                e.id === eventToPostpone.id ? { ...e, status: 'Reporté' } : e
            ));

            // Add new event to list
            const newEventFormatted = {
                id: newActivity.ID_Activite,
                title: newActivity.Type_Activite + ' - ' + (originalData.tiers?.Raisoc || 'Client inconnu'),
                date: postponeDate,
                time: postponeTime, // Simple approximation
                type: newActivity.Type_Activite,
                priority: 'Moyenne',
                company: originalData.tiers?.Raisoc || 'N/A',
                clientId: originalData.IDTiers,
                project: originalData.projet?.Nom_Projet || 'N/A',
                desc: newActivity.Description,
                status: newActivity.Statut,
                originalData: newActivity
            };

            setEvents(prevEvents => [...prevEvents, newEventFormatted]);
            
            // UI Cleanup
            if (selectedEvent && selectedEvent.id === eventToPostpone.id) {
                setSelectedEvent(prev => ({ ...prev, status: 'Reporté' }));
            }

            toast.success('Activité reportée et enregistrée avec succès');
            setIsPostponeModalOpen(false);
            setEventToPostpone(null);
            
        } catch (error) {
            console.error('Error postponing activity:', error);
            toast.error('Erreur lors du report de l\'activité');
        }
    };

    const getEventStyle = (event) => {
        if (event.status === 'Reporté') {
            return 'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.05)_5px,rgba(0,0,0,0.05)_10px)] border-gray-400 text-gray-500 opacity-80';
        }

        switch (event.type) {
            case 'Appel':
                return 'bg-blue-50 text-blue-700 border-blue-500';
            case 'Email':
                return 'bg-amber-50 text-amber-700 border-amber-500';
            case 'Visite':
                return 'bg-purple-50 text-purple-700 border-purple-500';
            case 'Réunion':
                return 'bg-indigo-50 text-indigo-700 border-indigo-500';
            case 'Note':
                return 'bg-emerald-50 text-emerald-700 border-emerald-500';
            default:
                if (event.priority === 'Haute') {
                    return 'bg-red-50 text-red-700 border-red-500';
                }
                return 'bg-slate-50 text-slate-700 border-slate-300';
        }
    };

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const days = [];
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const totalDays = daysInMonth(month, year);

    // Padding for calendar grid
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push({ type: 'empty' });
    }

    for (let i = 1; i <= totalDays; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        days.push({ type: 'day', number: i, dateStr, events: dayEvents });
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i); // +/- 5 years
    const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);

    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 animate-fade-in space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-blue-900 tracking-tight">Calendrier</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" /> Vos rendez-vous et activités
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Admin User Selector */}
                    {isAdmin && (
                        <div className="relative">
                            <select
                                value={selectedUserId || ''}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="pl-3 pr-8 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">Tous les utilisateurs</option>
                                {users.map(u => (
                                    <option key={u.UserID} value={u.UserID}>
                                        {u.FullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Month Selector */}
                    <div className="relative">
                        <select
                            value={month}
                            onChange={handleMonthChange}
                            className="pl-3 pr-8 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            {monthNames.map((m, index) => (
                                <option key={index} value={index}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Selector */}
                    <div className="relative">
                        <select
                            value={year}
                            onChange={handleYearChange}
                            className="pl-3 pr-8 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

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
                        onClick={() => navigate('/activites/new', { state: { from: 'calendar' } })}
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
                                    <button onClick={() => setCurrentDate(new Date())} className="text-[10px] font-black text-primary-600 hover:underline">AUJOURD'HUI</button>
                                </div>
                            </div>

                            {/* Weekly Header */}
                            <div className="grid grid-cols-7 text-center border-b border-gray-50">
                                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
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
                                                    {day.events && day.events.map(event => (
                                                        <button
                                                            key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            className={`w-full text-left p-2 rounded-xl text-[10px] font-black shadow-sm border-l-4 transition-transform hover:scale-[1.02] ${getEventStyle(event)}`}
                                                        >
                                                            <div className="truncate">{event.title} {event.status === 'Reporté' && '(REPORTÉ)'}</div>
                                                            <div className="text-[9px] opacity-60 mt-0.5">{event.time}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Legend */}
                            <div className="p-4 border-t border-gray-50 flex flex-wrap gap-4 justify-center bg-gray-50/30">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                    <span className="text-[10px] font-bold text-gray-500">Appel</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                    <span className="text-[10px] font-bold text-gray-500">Email</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                    <span className="text-[10px] font-bold text-gray-500">Visite</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                                    <span className="text-[10px] font-bold text-gray-500">Réunion</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-bold text-gray-500">Note</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-gray-400 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.5)_2px,rgba(255,255,255,0.5)_4px)]"></span>
                                    <span className="text-[10px] font-bold text-gray-500">Reporté</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                            {events.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">Aucune activité trouvée pour ce mois.</div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr className="text-left">
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Activité</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Heure</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {events.map(event => (
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
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                                        event.status === 'Reporté' 
                                                        ? 'bg-gray-100 text-gray-500 line-through' 
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {event.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button className="text-slate-400 hover:text-primary-600 transition-colors"><EyeIcon className="h-5 w-5" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side - Details Pane */}
                <div className="xl:col-span-1 space-y-8">
                    {selectedEvent ? (
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-primary-100/50 p-8 border border-white sticky top-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-600`}>
                                    {selectedEvent.type}
                                </span>
                                <button onClick={() => setSelectedEvent(null)} className="text-slate-300 hover:text-red-500 transition-colors"><AdjustmentsHorizontalIcon className="h-6 w-6" /></button>
                            </div>

                            <h2 className="text-2xl font-black text-blue-900 leading-tight mb-2">{selectedEvent.title}</h2>
                            <p className="text-xs font-bold text-slate-400 mb-8 italic">"{selectedEvent.desc || 'Pas de description'}"</p>

                            <div className="space-y-6 mb-8">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 group">
                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                                        <BuildingOfficeIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-0.5">CLIENT</p>
                                        <p className="text-sm font-black text-blue-900 truncate">{selectedEvent.company}</p>
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 group">
                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                                        <BriefcaseIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-0.5">PROJET</p>
                                        <p className="text-sm font-black text-blue-900 truncate">{selectedEvent.project}</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 group">
                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                                        <CalendarIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-0.5">DATE & HEURE</p>
                                        <p className="text-sm font-black text-blue-900 truncate">{selectedEvent.date} à {selectedEvent.time}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                {selectedEvent.status !== 'Reporté' && (
                                    <button 
                                        onClick={() => handlePostpone(selectedEvent)}
                                        className="col-span-1 py-4 bg-white text-orange-600 border border-orange-200 rounded-2xl font-bold text-xs shadow-sm hover:bg-orange-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <ArrowPathIcon className="h-4 w-4" /> REPORTER
                                    </button>
                                )}
                                <button onClick={() => navigate(`/activites/${selectedEvent.id}`, { state: { from: 'calendar' } })} className={`${selectedEvent.status !== 'Reporté' ? 'col-span-1' : 'col-span-2'} py-4 bg-blue-900 text-white rounded-2xl font-bold text-xs shadow-xl shadow-blue-200 hover:bg-blue-800 transition-all active:scale-95 flex items-center justify-center gap-2`}>
                                    <EyeIcon className="h-4 w-4" /> DÉTAILS
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

                </div>
            </div>

            {/* Postpone Modal */}
            {isPostponeModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-500">
                                <ArrowPathIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-black text-blue-900">Reporter l'activité</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Sélectionnez la nouvelle date et heure pour reprogrammer cette tâche.</p>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">Nouvelle Date</label>
                                <input 
                                    type="date"
                                    value={postponeDate}
                                    onChange={(e) => setPostponeDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">Nouvelle Heure</label>
                                <input 
                                    type="time" 
                                    value={postponeTime}
                                    onChange={(e) => setPostponeTime(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-50">
                            <button 
                                onClick={() => setIsPostponeModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                ANNULER
                            </button>
                            <button 
                                onClick={confirmPostpone}
                                className="flex-1 px-4 py-3 bg-blue-900 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircleIcon className="h-4 w-4" /> CONFIRMER
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reminder Modal */}
            {reminderModalData.length > 0 && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-transparent backdrop-blur-[2px] p-4 pointer-events-none">
                    <div className="w-full max-w-md pointer-events-auto space-y-4">
                        {reminderModalData.map((reminder, index) => (
                            <div key={`${reminder.id}-${index}`} className="bg-white rounded-[24px] shadow-2xl shadow-amber-500/20 p-6 border-l-4 border-amber-500 animate-in slide-in-from-top-10 duration-500">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-500 shadow-inner">
                                        <BellIcon className="h-6 w-6 animate-bounce" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Rappel</span>
                                            <span className="text-[10px] font-bold text-slate-400">{reminder.minutesLeft} min restantes</span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-800 leading-tight mb-2 truncate">{reminder.title}</h4>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                            <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> {reminder.date}</span>
                                            <span className="flex items-center gap-1.5"><ClockIcon className="h-3.5 w-3.5" /> {reminder.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button 
                                        onClick={() => snoozeReminder(reminder)}
                                        className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                                    >
                                        PLUS TARD
                                    </button>
                                    <button 
                                        onClick={() => dismissReminder(reminder)}
                                        className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors active:scale-95"
                                    >
                                        OK, VU
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
