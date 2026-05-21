import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyDevis } from './devisSlice';
import { fetchMyBcv } from './bcvSlice';
import { fetchMyBlv } from './blvSlice';
import { fetchMyFav } from './favSlice';

const TABS = [
  { id: 'devis',     label: 'Devis',             path: 'devis' },
  { id: 'bcv',       label: 'Bons de Commande',   path: 'bcv'   },
  { id: 'blv',       label: 'Bons de Livraison',  path: 'blv'   },
  { id: 'fav',       label: 'Factures',           path: 'fav'   },
];

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR');
};

const formatAmount = (v) => {
  if (v == null || v === '') return '-';
  return new Intl.NumberFormat('fr-TN', {
    style: 'decimal',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(v) + ' TND';
};

const DevisBadge = ({ doc }) => {
  if (doc.bTransf || doc.Btransf)
    return <span className="table-cell-status status-validated">Transformé</span>;
  if (doc.Valid)
    return <span className="table-cell-status status-validated">Validé</span>;
  return <span className="table-cell-status status-draft">Brouillon</span>;
};

const BcvBadge = ({ doc }) => {
  if (doc.bTransf || doc.Btransf)
    return <span className="table-cell-status status-validated">À livrer</span>;
  if (doc.Valid)
    return <span className="table-cell-status status-validated">Validé</span>;
  return <span className="table-cell-status status-pending">En attente</span>;
};

const BlvBadge = ({ doc }) => {
  if (doc.Facture)
    return <span className="table-cell-status status-validated">Facturé</span>;
  if (doc.Valid)
    return <span className="table-cell-status status-validated">Validé</span>;
  return <span className="table-cell-status status-draft">Brouillon</span>;
};

const FavBadge = ({ doc }) => {
  if (doc.MontantPaye >= doc.TotTTC && doc.TotTTC > 0)
    return <span className="table-cell-status status-validated">Payée</span>;
  if (doc.MontantPaye > 0)
    return <span className="table-cell-status status-draft">Partielle</span>;
  return <span className="table-cell-status status-pending">Non payée</span>;
};

const ClientDocuments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('devis');

  const devis    = useSelector((s) => s.devis.devis);
  const bcvList  = useSelector((s) => s.bcv.bcvList);
  const blvList  = useSelector((s) => s.blv.blvList);
  const favList  = useSelector((s) => s.fav.favList);

  const loadingDevis = useSelector((s) => s.devis.loading);
  const loadingBcv   = useSelector((s) => s.bcv.loading);
  const loadingBlv   = useSelector((s) => s.blv.loading);
  const loadingFav   = useSelector((s) => s.fav.loading);

  useEffect(() => {
    dispatch(fetchMyDevis());
    dispatch(fetchMyBcv());
    dispatch(fetchMyBlv());
    dispatch(fetchMyFav());
  }, [dispatch]);

  const isLoading =
    (activeTab === 'devis' && loadingDevis) ||
    (activeTab === 'bcv'   && loadingBcv)   ||
    (activeTab === 'blv'   && loadingBlv)   ||
    (activeTab === 'fav'   && loadingFav);

  const getRows = () => {
    switch (activeTab) {
      case 'devis': return devis;
      case 'bcv':   return bcvList;
      case 'blv':   return blvList;
      case 'fav':   return favList;
      default:      return [];
    }
  };

  const getColumns = () => {
    switch (activeTab) {
      case 'devis':
        return [
          { key: 'Nf',      label: 'Référence', render: (d) => <span className="table-cell-ref">DEV-{d.Nf || '-'}</span> },
          { key: 'DatUser', label: 'Date',       render: (d) => formatDate(d.DatUser || d.MDate) },
          { key: 'TotHT',   label: 'Total HT',   render: (d) => formatAmount(d.TotHT) },
          { key: 'TotTTC',  label: 'Total TTC',  render: (d) => formatAmount(d.TotTTC) },
          { key: 'status',  label: 'Statut',     render: (d) => <DevisBadge doc={d} /> },
        ];
      case 'bcv':
        return [
          { key: 'Nf',      label: 'Référence', render: (d) => <span className="table-cell-ref">BC-{d.Nf || '-'}</span> },
          { key: 'DatUser', label: 'Date',       render: (d) => formatDate(d.DatUser || d.MDate) },
          { key: 'TotTTC',  label: 'Total TTC',  render: (d) => formatAmount(d.TotTTC) },
          { key: 'CodDev',  label: 'Devis',      render: (d) => d.CodDev || '-' },
          { key: 'status',  label: 'Statut',     render: (d) => <BcvBadge doc={d} /> },
        ];
      case 'blv':
        return [
          { key: 'Nf',      label: 'Référence', render: (d) => <span className="table-cell-ref">BL-{d.Nf || '-'}</span> },
          { key: 'DatUser', label: 'Date',       render: (d) => formatDate(d.DatUser || d.MDate) },
          { key: 'TotTTC',  label: 'Total TTC',  render: (d) => formatAmount(d.TotTTC) },
          { key: 'CodDev',  label: 'Commande',   render: (d) => d.CodDev || '-' },
          { key: 'status',  label: 'Statut',     render: (d) => <BlvBadge doc={d} /> },
        ];
      case 'fav':
        return [
          { key: 'Nf',      label: 'Référence', render: (d) => <span className="table-cell-ref">FAC-{d.Nf || '-'}</span> },
          { key: 'DatUser', label: 'Date',       render: (d) => formatDate(d.DatUser || d.MDate) },
          { key: 'TotTTC',  label: 'Total TTC',  render: (d) => formatAmount(d.TotTTC) },
          { key: 'status',  label: 'Statut',     render: (d) => <FavBadge doc={d} /> },
        ];
      default:
        return [];
    }
  };

  const rows    = getRows();
  const columns = getColumns();
  const tab     = TABS.find((t) => t.id === activeTab);

  const handleRowClick = (doc) => {
    const id = doc.Guid || doc.Nf;
    if (id) navigate(`/${tab.path}/${id}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Mes Documents
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Consultez vos devis, commandes, livraisons et factures
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === t.id ? '#2563eb' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Chargement...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}
                  >
                    Aucun document trouvé
                  </td>
                </tr>
              ) : (
                rows.map((doc) => {
                  const docId = doc.Guid || doc.Nf;
                  return (
                    <tr key={docId}>
                      {columns.map((col) => (
                        <td key={col.key}>
                          {col.render
                            ? col.render(doc)
                            : <span className="table-cell-ref">{doc[col.key] || '-'}</span>}
                        </td>
                      ))}
                      <td>
                        <div className="table-actions">
                          <button
                            title="Voir le détail"
                            onClick={() => handleRowClick(doc)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ClientDocuments;
