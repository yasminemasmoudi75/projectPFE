import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
import axiosInstance from '../../app/axios';
import toast from 'react-hot-toast';

const DashboardSimple = () => {
  const { user } = useAuth();
  const { allPermissions } = usePermission();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    clients: 0,
    devis: 0,
    bcv: 0,
    blv: 0,
    fav: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Appels API parallèles
        const [clientsRes, devisRes, bcvRes, blvRes, favRes] = await Promise.all([
          axiosInstance.get('/tiers?limit=1').catch(() => ({ data: { total: 0 } })),
          axiosInstance.get('/devis?limit=1').catch(() => ({ data: { total: 0 } })),
          axiosInstance.get('/bcv?limit=1').catch(() => ({ data: { total: 0 } })),
          axiosInstance.get('/blv?limit=1').catch(() => ({ data: { total: 0 } })),
          axiosInstance.get('/fav?limit=1').catch(() => ({ data: { total: 0 } }))
        ]);

        setStats({
          clients: clientsRes.data?.total || 0,
          devis: devisRes.data?.total || 0,
          bcv: bcvRes.data?.total || 0,
          blv: blvRes.data?.total || 0,
          fav: favRes.data?.total || 0
        });

        // Activités simulées pour la démo
        setRecentActivities([
          { id: 1, type: 'devis', title: 'Nouveau devis créé', desc: 'DV-2024-089 - TechnoPlus SARL', time: 'Il y a 2h', icon: 'blue' },
          { id: 2, type: 'bcv', title: 'Bon de commande validé', desc: 'BC-2024-112 - 14,500 TND', time: 'Il y a 4h', icon: 'emerald' },
          { id: 3, type: 'blv', title: 'Livraison effectuée', desc: 'BL-2024-045 - Ahmed Ben Ali', time: 'Il y a 6h', icon: 'amber' },
          { id: 4, type: 'client', title: 'Nouveau client ajouté', desc: 'BioTech Industries - SFAX', time: 'Hier', icon: 'rose' },
        ]);

      } catch (error) {
        console.error('Erreur dashboard:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [allPermissions]);

  const statCards = [
    { name: 'Clients', value: stats.clients, icon: 'clients', color: 'bg-blue' },
    { name: 'Devis', value: stats.devis, icon: 'devis', color: 'bg-emerald' },
    { name: 'Bons de Commande', value: stats.bcv, icon: 'bcv', color: 'bg-amber' },
    { name: 'Bons de Livraison', value: stats.blv, icon: 'blv', color: 'bg-rose' },
  ];

  const getIcon = (iconName) => {
    const icons = {
      clients: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
      ),
      devis: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        </svg>
      ),
      bcv: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path>
        </svg>
      ),
      blv: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"></path>
        </svg>
      ),
    };
    return icons[iconName] || icons.clients;
  };

  const getActivityIcon = (type) => {
    const icons = {
      blue: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        </svg>
      ),
      emerald: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path>
        </svg>
      ),
      amber: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"></path>
        </svg>
      ),
      rose: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
      ),
    };
    return icons[type] || icons.blue;
  };

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className={`stat-icon ${stat.color}`}>
              {getIcon(stat.icon)}
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Activité Récente</h3>
            <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              Voir tout
            </button>
          </div>
          <div className="dashboard-card-body">
            <div className="activity-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.icon}`}>
                    {getActivityIcon(activity.icon)}
                  </div>
                  <div className="activity-content">
                    <h4 className="activity-title">{activity.title}</h4>
                    <p className="activity-desc">{activity.desc}</p>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Actions Rapides</h3>
          </div>
          <div className="dashboard-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <button onClick={() => navigate('/clients/new')} className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nouveau Client
              </button>
              <button onClick={() => navigate('/devis/new')} className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nouveau Devis
              </button>
              <button onClick={() => navigate('/bcv/new')} className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nouveau BC
              </button>
              <button onClick={() => navigate('/blv/new')} className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nouveau BL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;
