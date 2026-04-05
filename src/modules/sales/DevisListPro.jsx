import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { fetchDevis } from './devisSlice';
import { StatCard, DataTable, PageHeader, SearchBar } from '../../components/ui';
import { formatDate, formatCurrency } from '../../utils/format';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';
import toast from 'react-hot-toast';
import axios from '../../app/axios';

const DevisListPro = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canCreate, canEdit, canDelete, canValidate } = usePermission(MODULE_CODES.DEVIS);
  const { devis, loading } = useSelector((state) => state.devis);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchDevis());
  }, [dispatch]);

  // Stats
  const stats = useMemo(() => {
    const total = devis.length;
    const totalAmount = devis.reduce((sum, d) => sum + (d.Montant || 0), 0);
    const valides = devis.filter(d => d.Valid === true).length;
    const enAttente = total - valides;
    const convertis = devis.filter(d => d.bTransf === true).length;
    return { total, totalAmount, valides, enAttente, convertis };
  }, [devis]);

  // Filtered devis
  const filteredDevis = useMemo(() => {
    return devis.filter(d => {
      const matchesSearch = !filters.search ||
        (d.NumDoc || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (d.client?.Raisoc || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (d.CodTiers || '').toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' ||
        (filters.status === 'valid' && d.Valid === true && d.bTransf !== true) ||
        (filters.status === 'pending' && d.Valid !== true) ||
        (filters.status === 'converted' && d.bTransf === true);

      const matchesDateFrom = !filters.dateFrom || new Date(d.DateDoc) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(d.DateDoc) <= new Date(filters.dateTo);

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [devis, filters]);

  // Columns
  const columns = [
    {
      key: 'NumDoc',
      title: 'N° Devis',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
          {value}
        </span>
      )
    },
    {
      key: 'client',
      title: 'Client',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {(value?.Raisoc || row.CodTiers || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{value?.Raisoc || row.CodTiers || 'N/A'}</p>
            <p className="text-xs text-slate-500">{row.CodTiers}</p>
          </div>
        </div>
      )
    },
    {
      key: 'DateDoc',
      title: 'Date',
      render: (value) => (
        <div className="flex items-center gap-2 text-slate-600">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'Montant',
      title: 'Montant',
      render: (value) => (
        <span className="font-bold text-slate-800">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (_, row) => {
        if (row.bTransf) {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Transformé
            </span>
          );
        }
        if (row.Valid) {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Validé
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
            <ClockIcon className="h-3.5 w-3.5" />
            En attente
          </span>
        );
      }
    }
  ];

  const handleValidate = async (id) => {
    try {
      await axios.patch(`/devis/${id}/validate`);
      toast.success('Devis validé avec succès');
      dispatch(fetchDevis());
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return;
    try {
      await axios.delete(`/devis/${id}`);
      toast.success('Devis supprimé');
      dispatch(fetchDevis());
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = () => {
    const csv = [
      ['N° Devis', 'Client', 'Date', 'Montant', 'Statut'].join(';'),
      ...filteredDevis.map(d => [
        d.NumDoc,
        d.client?.Raisoc || d.CodTiers,
        formatDate(d.DateDoc),
        d.Montant,
        d.bTransf ? 'Transformé' : d.Valid ? 'Validé' : 'En attente'
      ].join(';'))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV réussi');
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Gestion des Devis"
        subtitle={`${stats.total} devis • ${formatCurrency(stats.totalAmount)}`}
        icon={DocumentTextIcon}
        action={canCreate && (
          <button
            onClick={() => navigate('/devis/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau Devis
          </button>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Devis"
          value={stats.total}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Montant Total"
          value={formatCurrency(stats.totalAmount)}
          subtitle="Valeur globale"
          icon={CurrencyDollarIcon}
          color="emerald"
        />
        <StatCard
          title="Validés"
          value={stats.valides}
          subtitle={`${Math.round((stats.valides / stats.total) * 100) || 0}%`}
          icon={CheckCircleIcon}
          color="emerald"
        />
        <StatCard
          title="En Attente"
          value={stats.enAttente}
          icon={ClockIcon}
          color="amber"
        />
        <StatCard
          title="Transformés"
          value={stats.convertis}
          subtitle="En commandes"
          icon={ArrowTrendingUpIcon}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <SearchBar
            value={filters.search}
            onChange={(v) => setFilters(f => ({ ...f, search: v }))}
            placeholder="Rechercher par n°, client..."
            className="flex-1"
          />
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
              Filtres
            </button>
            
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-all"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export
            </button>
            
            <button
              onClick={() => dispatch(fetchDevis())}
              className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="valid">Validés</option>
                <option value="pending">En attente</option>
                <option value="converted">Transformés</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date début</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date fin</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredDevis}
        loading={loading}
        onRowClick={(row) => navigate(`/devis/${row.NumDoc}`)}
        actions={(row) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/devis/${row.NumDoc}`);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Voir"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            {canEdit && !row.Valid && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/devis/${row.NumDoc}/edit`);
                }}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            )}
            {canValidate && !row.Valid && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidate(row.NumDoc);
                }}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Valider"
              >
                <CheckCircleIcon className="h-5 w-5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row.NumDoc);
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      />
    </div>
  );
};

export default DevisListPro;
