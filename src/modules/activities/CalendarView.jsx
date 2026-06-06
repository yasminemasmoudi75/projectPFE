import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';
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
    MagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const CalendarView = () => {
    const navigate = useNavigate();
    const { user, isAdmin, isTechnicien } = useAuth();
    const { canCreate, canEdit, canDelete, isFilterRepresEnabled } = usePermission(MODULE_CODES.CALENDRIER);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
    const [events, setEvents] = useState([]);
    const [commerciaux, setCommerciaux] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);

    // Etas pour le modal de report
    const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
    const [eventToPostpone, setEventToPostpone] = useState(null);
    const [postponeDate, setPostponeDate] = useState('');
    const [postponeTime, setPostponeTime] = useState('');
    const [validating, setValidating] = useState(false);

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

    // Auto-refresh toutes les 60 secondes
    useEffect(() => {
        const interval = setInterval(() => setRefreshTick((t) => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch members for the user selector (admin sees all non-client staff; agent sees commercials only)
    useEffect(() => {
        const fetchCommerciaux = async () => {
            const normalizedRole = String(user?.UserRole || '').trim().toLowerCase();
            const isCommercial = ['commercial', 'commerciale'].includes(normalizedRole);
            const isClient = normalizedRole === 'client';
            const isAdminRole = ['admin', 'administrateur'].includes(normalizedRole);

            // Technicien sees only their own activities — no member selector
            if (isCommercial || isClient || isTechnicien) return;

            try {
                let rawData = [];
                if (isAdminRole) {
                    const response = await axios.get('/users/members/calendar-filter');
                    rawData = Array.isArray(response.data) ? response.data : (response.data?.data || response || []);
                } else {
                    const response = await axios.get('/users/commercials/activites-filter', {
                        params: { moduleCode: String(MODULE_CODES.CALENDRIER), includeAll: isFilterRepresEnabled ? 'false' : 'true' }
                    });
                    rawData = Array.isArray(response.data) ? response.data : (response.data?.data || response || []);
                }
                const mapped = rawData.map(c => ({
                    UserID: c.userId || c.UserID,
                    FullName: c.fullName || c.FullName || c.label || c.login || c.LoginName,
                    Role: c.role || c.Role || ''
                }));
                setCommerciaux(mapped);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        };
        fetchCommerciaux();
    }, [user, isFilterRepresEnabled]);

    useEffect(() => {
        const fetchUserActivities = async () => {
            if (!user) return;
            
            setLoading(true);
            try {
                const params = {
                    moduleCode: MODULE_CODES.CALENDRIER
                };
                if (selectedUserId) {
                    params.userId = selectedUserId;
                }
                
                const response = await axios.get('/activites', {
                    params
                });

                const fetchedEvents = (Array.isArray(response) ? response : response?.data || []).map(activite => {
                    const isMeetingInvite = activite.Type_Activite === 'Réunion' && String(activite.Description || '').startsWith('Réunion avec ');
                    const clientName = activite.tiers?.Raisoc;
                    let title;
                    if (activite.Type_Activite === 'Réunion') {
                        if (isMeetingInvite) {
                            // "Réunion avec Jean Dupont"
                            title = String(activite.Description || '').split(' — ')[0];
                        } else {
                            title = clientName ? `Réunion — ${clientName}` : 'Réunion';
                        }
                    } else {
                        title = activite.Type_Activite + (clientName ? ` — ${clientName}` : '');
                    }
                    return {
                        id: activite.ID_Activite,
                        title,
                        date: activite.Date_Activite ? new Date(activite.Date_Activite).toISOString().split('T')[0] : '',
                        time: activite.Date_Activite ? new Date(activite.Date_Activite).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                        type: activite.Type_Activite,
                        priority: 'Moyenne',
                        company: clientName || null,
                        clientId: activite.IDTiers,
                        project: activite.projet?.Nom_Projet || null,
                        desc: activite.Description || '',
                        status: activite.Statut,
                        valide: Number(activite.Valide || 0),
                        isMeetingInvite,
                        originalData: activite
                    };
                });

                // When viewing all users (no userId filter), deduplicate: if the same
                // Réunion already has an organizer copy, hide the invitation copy.
                let eventsToSet = fetchedEvents;
                if (!selectedUserId) {
                    eventsToSet = fetchedEvents.filter((event) => {
                        if (!event.isMeetingInvite) return true;
                        return !fetchedEvents.some(
                            (other) =>
                                !other.isMeetingInvite &&
                                other.type === 'Réunion' &&
                                other.date === event.date &&
                                other.time === event.time
                        );
                    });
                }

                setEvents(eventsToSet);
            } catch (error) {
                console.error('Error fetching activities:', error);
                toast.error('Erreur lors du chargement des activités');
            } finally {
                setLoading(false);
            }
        };

        fetchUserActivities();
    }, [user, selectedUserId, refreshTick]);

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
        if (event.isMeetingInvite) {
            return 'bg-violet-50 text-violet-700 border-violet-500 ring-1 ring-violet-300';
        }
        switch (event.type) {
            case 'Appel':   return 'bg-blue-50 text-blue-700 border-blue-500';
            case 'Email':   return 'bg-amber-50 text-amber-700 border-amber-500';
            case 'Visite':  return 'bg-purple-50 text-purple-700 border-purple-500';
            case 'Réunion': return 'bg-indigo-50 text-indigo-700 border-indigo-500';
            case 'Note':    return 'bg-emerald-50 text-emerald-700 border-emerald-500';
            default:        return 'bg-slate-50 text-slate-700 border-slate-300';
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
                    {/* Member Selector (admin: all staff; agent: commercials; technicien: hidden — own activities only) */}
                    {!isTechnicien && !['commercial', 'commerciale', 'client'].includes(String(user?.UserRole || '').trim().toLowerCase()) && (
                        <div className="relative">
                            <select
                                value={selectedUserId || ''}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="pl-3 pr-8 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">
                                    {['admin', 'administrateur'].includes(String(user?.UserRole || '').trim().toLowerCase())
                                        ? 'Tous les membres'
                                        : 'Tous les commerciaux'}
                                </option>
                                <option value={user?.UserID || user?.id}>Mes activités</option>
                                {commerciaux.map(c => (
                                    <option key={c.UserID} value={c.UserID}>
                                        {c.FullName}{c.Role ? ` (${c.Role})` : ''}
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
                    {canCreate && (
                        <button
                            onClick={() => navigate('/activites/new', { state: { from: 'calendar' } })}
                            className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" /> NOUVELLE ACTION
                        </button>
                    )}
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
                                                            <div className="truncate flex items-center gap-1">
                                                                {event.isMeetingInvite && <span className="text-[8px] bg-violet-200 text-violet-700 rounded px-1 shrink-0">INVITÉ</span>}
                                                                {event.title}
                                                                {event.status === 'Reporté' && ' (REPORTÉ)'}
                                                            </div>
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
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-violet-500 ring-1 ring-violet-300"></span>
                                    <span className="text-[10px] font-bold text-gray-500">Réunion (invité)</span>
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
                <div className="xl:col-span-1">
                    {selectedEvent ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">

                            {/* Gradient accent bar */}
                            <div className={`h-1 w-full bg-gradient-to-r ${
                                selectedEvent.type === 'Appel'   ? 'from-blue-500 to-sky-400'     :
                                selectedEvent.type === 'Email'   ? 'from-amber-500 to-orange-400' :
                                selectedEvent.type === 'Visite'  ? 'from-violet-500 to-purple-400':
                                selectedEvent.type === 'Réunion' ? 'from-indigo-500 to-blue-400'  :
                                selectedEvent.type === 'Note'    ? 'from-emerald-500 to-teal-400' :
                                                                   'from-slate-400 to-slate-500'
                            }`} />

                            {/* Header */}
                            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                        selectedEvent.type === 'Appel'   ? 'bg-blue-50 text-blue-700 border-blue-200'      :
                                        selectedEvent.type === 'Email'   ? 'bg-amber-50 text-amber-700 border-amber-200'    :
                                        selectedEvent.type === 'Visite'  ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                        selectedEvent.type === 'Réunion' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                        selectedEvent.type === 'Note'    ? 'bg-emerald-50 text-emerald-700 border-emerald-200':
                                                                           'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {selectedEvent.type}
                                    </span>
                                    {selectedEvent.isMeetingInvite && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Invité</span>
                                    )}
                                    {selectedEvent.status === 'Reporté' && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">Reporté</span>
                                    )}
                                    {selectedEvent.valide === 1 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Validé</span>
                                    )}
                                </div>
                                <button onClick={() => setSelectedEvent(null)}
                                    className="h-6 w-6 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all flex-shrink-0 mt-0.5">
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </div>

                            {/* Title */}
                            <div className="px-5 pt-4 pb-3">
                                <h2 className="text-[17px] font-black text-slate-900 leading-snug tracking-tight">{selectedEvent.title}</h2>
                                {selectedEvent.desc && !selectedEvent.desc.includes('Participants :') && !selectedEvent.desc.startsWith('Réunion avec') && (
                                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2 italic">{selectedEvent.desc}</p>
                                )}
                            </div>

                            {/* Info rows */}
                            <div className="px-5 pb-3 divide-y divide-slate-100">

                                {selectedEvent.type === 'Réunion' && selectedEvent.isMeetingInvite && (
                                    <div className="flex items-center gap-3 py-2.5">
                                        <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="h-3.5 w-3.5 text-violet-600"/>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Organisé par</p>
                                            <p className="text-sm font-medium text-slate-700 truncate">{String(selectedEvent.desc||'').replace('Réunion avec ','').split(' — ')[0]}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.type === 'Réunion' && !selectedEvent.isMeetingInvite && selectedEvent.desc?.includes('Participants :') && (
                                    <div className="flex items-center gap-3 py-2.5">
                                        <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="h-3.5 w-3.5 text-indigo-600"/>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Participants</p>
                                            <p className="text-sm font-medium text-slate-700">{String(selectedEvent.desc||'').split('Participants :')[1]?.trim()||'—'}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 py-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-[#e0f0ff] flex items-center justify-center flex-shrink-0">
                                        <CalendarIcon className="h-3.5 w-3.5 text-[#0062AF]"/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Date & heure</p>
                                        <p className="text-sm font-medium text-slate-700">{selectedEvent.date} à {selectedEvent.time}</p>
                                    </div>
                                </div>

                                {selectedEvent.company && (
                                    <div className="flex items-center gap-3 py-2.5">
                                        <div className="h-7 w-7 rounded-lg bg-[#e0f0ff] flex items-center justify-center flex-shrink-0">
                                            <BuildingOfficeIcon className="h-3.5 w-3.5 text-[#0062AF]"/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Client</p>
                                            <p className="text-sm font-medium text-slate-700 truncate">{selectedEvent.company}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.project && (
                                    <div className="flex items-center gap-3 py-2.5">
                                        <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                            <BriefcaseIcon className="h-3.5 w-3.5 text-violet-600"/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Projet</p>
                                            <p className="text-sm font-medium text-slate-700 truncate">{selectedEvent.project}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedEvent.status !== 'Reporté' && (
                                        <button onClick={() => handlePostpone(selectedEvent)}
                                            className="flex items-center justify-center gap-1.5 h-10 text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all active:scale-[0.97]">
                                            <ArrowPathIcon className="h-4 w-4"/> Reporter
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate(`/activites/${selectedEvent.id}`, { state: { from: 'calendar' } })}
                                        className={`flex items-center justify-center gap-1.5 h-10 text-sm font-semibold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-[0.97] ${selectedEvent.status === 'Reporté' ? 'col-span-2' : ''}`}>
                                        <EyeIcon className="h-4 w-4"/> Détails
                                    </button>
                                </div>
                                {canEdit && selectedEvent.valide !== 1 && (
                                    <button
                                        onClick={() => navigate(`/activites/edit/${selectedEvent.id}`, { state: { from: 'calendar' } })}
                                        className="w-full flex items-center justify-center gap-1.5 h-10 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all active:scale-[0.97]">
                                        <PencilIcon className="h-4 w-4"/> Modifier
                                    </button>
                                )}
                                {selectedEvent.valide !== 1 && (
                                    <button disabled={validating}
                                        onClick={async () => {
                                            setValidating(true);
                                            try {
                                                await axios.patch(`/activites/${selectedEvent.id}/validate`);
                                                setSelectedEvent(prev => ({ ...prev, valide: 1, status: 'Terminé' }));
                                                setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, valide: 1, status: 'Terminé' } : e));
                                                toast.success('Activité validée');
                                            } catch {
                                                toast.error('Erreur lors de la validation');
                                            } finally { setValidating(false); }
                                        }}
                                        className="w-full flex items-center justify-center gap-2 h-10 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-60 active:scale-[0.97]">
                                        <CheckCircleIcon className="h-4 w-4"/>
                                        {validating ? 'Validation…' : 'Valider'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-10 sticky top-6 min-h-[280px]">
                            <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                <BellIcon className="h-7 w-7 text-slate-200" />
                            </div>
                            <p className="text-sm font-semibold text-slate-300">Sélectionnez une activité</p>
                            <p className="text-xs text-slate-200 mt-1">Les détails s'afficheront ici</p>
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
