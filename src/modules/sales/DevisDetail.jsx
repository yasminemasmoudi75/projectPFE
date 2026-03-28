import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PhotoIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CreditCardIcon,
  UserIcon,
  CogIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { fetchDevisById, validateDevis, convertDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { getImageUrl } from '../../utils/imageUrl';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '@app/axios';

const DevisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentDevis: devis, loading, error } = useSelector((state) => state.devis);
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItemExpanded = (tempId) => {
    setExpandedItems(prev => ({
      ...prev,
      [tempId]: !prev[tempId]
    }));
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchDevisById(id));
    }
  }, [dispatch, id]);

  const handleValidate = async () => {
    try {
      await dispatch(validateDevis(id)).unwrap();
      toast.success('Devis validé avec succès');
    } catch (err) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleConvert = async () => {
    try {
      await dispatch(convertDevis(id)).unwrap();
      toast.success('Devis converti en commande');
      navigate('/bcv');
    } catch (err) {
      toast.error('Erreur lors de la conversion');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/devis/${id}/pdf`, {
        responseType: 'blob'
      });

      // Créer un lien pour le téléchargement
      const pdfBlob = response instanceof Blob ? response : new Blob([response]);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis_${devis.Prfx}${devis.Nf}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Nettoyage
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF généré avec succès');
    } catch (err) {
      console.error('Erreur PDF:', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 p-8">Erreur: {error}</div>;
  if (!devis) return <div className="text-center text-gray-500 p-8">Devis non trouvé</div>;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/devis')}
          className="flex items-center text-gray-500 hover:text-primary-600 transition-all font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Retour à la liste
        </button>
        <div className="flex gap-2 flex-wrap">
          {!devis.Valid && (
            <button
              onClick={handleValidate}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 font-bold text-sm"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Valider
            </button>
          )}
          {!devis.IsConverted && devis.Valid && (
            <button
              onClick={handleConvert}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 font-bold text-sm animate-pulse-slow"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Transformer en BC
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-bold text-sm"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Hero Section with Status */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl shadow-sm p-8 border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 mb-2">
              Devis N° <span className="text-primary-600">{devis.Prfx}{devis.Nf}</span>
            </h1>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4" />
              Crée le {formatDate(devis.DatUser)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={clsx(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest",
              devis.Valid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            )}>
              {devis.Valid ? "✓ Validé" : "⟳ Brouillon"}
            </span>
            {devis.IsConverted && (
              <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-100 text-blue-800">
                ✓ Commande créée
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Commercial</p>
            <p className="font-bold text-slate-800">{devis.DesRepres || '-'}</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Réf.</p>
            <p className="font-mono text-slate-800 text-xs">{devis.Guid.substring(0, 12).toUpperCase()}</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Catégorie</p>
            <p className="font-bold text-slate-800">{devis.categ || '-'}</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Type</p>
            <p className="font-bold text-slate-800">{devis.type || '-'}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-primary-600" />
              Informations Client
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Client</p>
                <p className="font-black text-slate-800 text-lg">{devis.LibTiers}</p>
                <p className="text-slate-500 text-xs mt-1">Code: <span className="font-mono text-slate-700">{devis.CodTiers}</span></p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Adresse</p>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {devis.Adresse}<br />
                  <span className="font-bold">{devis.Ville}</span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Matricule / CIN</p>
                <p className="font-mono text-slate-800 bg-slate-50 px-3 py-2 rounded-lg w-fit text-sm">{devis.Cin || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Contact</p>
                <p className="text-slate-800">{devis.IDContact || '-'}</p>
              </div>
            </div>
            {devis.Remarq && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Remarques</p>
                <div className="bg-blue-50 text-blue-900 p-4 rounded-lg text-sm border border-blue-100">
                  {devis.Remarq}
                </div>
              </div>
            )}
          </div>

          {/* Configuration & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CogIcon className="h-4 w-4 text-amber-600" />
                Configuration
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Devise</span>
                  <span className="font-bold text-slate-800">{devis.CodDev || 'TND'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Cours de change</span>
                  <span className="font-bold text-slate-800">{devis.Cours || 1}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Catégorisation</span>
                  <span className="font-bold text-slate-800">{devis.NatReg || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Acompte</span>
                  <span className="font-bold text-slate-800">{formatCurrency(devis.avanceforf || 0)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TruckIcon className="h-4 w-4 text-emerald-600" />
                Livraison & Transport
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Date livraison</span>
                  <span className="font-bold text-slate-800">{formatDate(devis.DatLiv) || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Frais transport</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(devis.Frais || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Chauffeur</span>
                  <span className="font-bold text-slate-800">{devis.DesChauff || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Imprimé</span>
                  <span className="text-xs badge badge-soft-blue">{devis.bLivr ? '✓ Oui' : '✗ Non'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table with Expandable Details */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-50 bg-slate-50/50">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                Articles du Devis ({devis?.details?.length || 0})
              </h2>
            </div>

            {devis?.details && devis.details.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {devis.details.map((item, idx) => (
                  <div key={idx}>
                    {/* Main Row */}
                    <div className="px-6 py-4 hover:bg-blue-50/20 transition-all flex items-center gap-4">
                      <button
                        onClick={() => toggleItemExpanded(`item-${idx}`)}
                        className="text-slate-400 hover:text-slate-600 transition-all flex-shrink-0"
                      >
                        <ChevronDownIcon className={clsx(
                          "h-5 w-5 transition-transform duration-300",
                          expandedItems[`item-${idx}`] && "rotate-180"
                        )} />
                      </button>

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {item.product?.urlimg ? (
                          <img
                            src={getImageUrl(item.product.urlimg)}
                            alt={item.LibArt}
                            className="h-12 w-12 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <PhotoIcon className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-sm truncate">{item.LibArt}</p>
                          <p className="text-[10px] text-slate-400 font-mono italic">{item.CodArt}</p>
                          {item.CodColor && <p className="text-[10px] text-slate-500 mt-1">
                            <span className="font-bold">Couleur:</span> {item.DesColor || item.CodColor}
                            {item.Taille && ` • Taille: ${item.Taille}`}
                          </p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm font-bold text-right flex-shrink-0">
                        <div>
                          <p className="text-slate-400 text-xs">Qty</p>
                          <p className="text-blue-600 text-lg">{item.Qt}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">P.U HT</p>
                          <p className="text-slate-800 text-sm">{Number(item.PuHT || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Total HT</p>
                          <p className="text-slate-800 text-sm">{(item.Qt * (item.PuHT || 0)).toLocaleString(undefined, { minimumFractionDigits: 3 })}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Detail Row */}
                    {expandedItems[`item-${idx}`] && (
                      <div className="bg-blue-50/30 px-6 py-6 border-t border-gray-50">
                        <div className="space-y-6 ml-8">
                          {/* Section: Description & Details */}
                          <div className="border-b border-gray-200 pb-6">
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                              Description & Détails
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Description Étendue</label>
                                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-gray-100">{item.ExLibArt || 'Aucune description'}</p>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Code Barre</label>
                                <p className="text-sm font-mono text-slate-700 bg-white p-3 rounded-lg border border-gray-100">{item.Codabar || '-'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Section: Prices */}
                          <div className="border-b border-gray-200 pb-6">
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                              Tarification
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Prix Public</label>
                                <p className="text-sm font-bold text-slate-800">{Number(item.PvPub || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">P.U Devis</label>
                                <p className="text-sm font-bold text-blue-600">{Number(item.PuDev || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">P.U TTC</label>
                                <p className="text-sm font-bold text-slate-800">{Number(item.PuTTC || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</p>
                              </div>
                            </div>
                          </div>

                          {/* Section: Amounts */}
                          <div className="border-b border-gray-200 pb-6">
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                              Montants de la Ligne
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Montant HT</label>
                                <p className="text-sm font-bold text-slate-800">{Number(item.MntHT || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">TVA ({item.Tva || 19}%)</label>
                                <p className="text-sm font-bold text-amber-600">{Number(item.MntTVA || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">FODEC</label>
                                <p className="text-sm font-bold text-emerald-600">{Number(item.MntFodec || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Frais</label>
                                <p className="text-sm font-bold text-slate-800">{Number(item.MntFrais || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</p>
                              </div>
                            </div>
                          </div>

                          {/* Section: Delivery & Import */}
                          <div>
                            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                              Livraison & Suivi
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">N° BL</label>
                                <p className="text-sm font-mono text-slate-800">{item.NumBL || '-'}</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date BL</label>
                                <p className="text-sm text-slate-800">{item.DateBL ? formatDate(item.DateBL) : '-'}</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">N° Import</label>
                                <p className="text-sm font-mono text-slate-800">{item.NumImport || '-'}</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date Import</label>
                                <p className="text-sm text-slate-800">{item.DatImport ? formatDate(item.DatImport) : '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-slate-400 italic text-sm">
                Aucun article associé à ce devis.
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Financials & Warehouse */}
        <div className="space-y-6">
          {/* Financials Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4 text-primary-600" />
              Résumé Financier
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-600">Total HT</span>
                <span className="font-bold text-slate-800">{formatCurrency(devis.TotHT)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-600">Remise</span>
                <span className="font-bold text-red-600">-{formatCurrency(devis.TotRem)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-600">Net HT</span>
                <span className="font-bold text-slate-800">{formatCurrency((devis.TotHT || 0) - (devis.TotRem || 0))}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-600">TVA (19%)</span>
                <span className="font-bold text-amber-600">{formatCurrency(devis.TotTva)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-600">FODEC</span>
                <span className="font-bold text-emerald-600">{formatCurrency(devis.TotFodec || 0)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-600">Timbre</span>
                <span className="font-bold text-slate-800">{formatCurrency(devis.Timbre)}</span>
              </div>
              <div className="pt-4 mt-4 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-800">Total TTC</span>
                  <span className="text-2xl font-black text-primary-600">
                    {formatCurrency(devis.TotTTC)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse & Inventory */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BuildingStorefrontIcon className="h-4 w-4 text-indigo-600" />
              Entrepôt & Magasin
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Magasin</p>
                <p className="font-bold text-slate-800">{devis.DesMag || '-'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{devis.CodMag || '-'}</p>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Représentant</p>
                <p className="font-bold text-slate-800">{devis.DesRepres || '-'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{devis.CodRepres || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisDetail;

