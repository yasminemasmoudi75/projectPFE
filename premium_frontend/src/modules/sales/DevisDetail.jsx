import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { fetchDevisById, validateDevis, convertDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const DevisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentDevis: devis, loading, error } = useSelector((state) => state.devis);

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
    } catch (err) {
      toast.error('Erreur lors de la conversion');
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
        <div className="flex gap-2">
          {!devis.Valid && (
            <button
              onClick={handleValidate}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 font-bold"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Valider le Devis
            </button>
          )}
          {!devis.IsConverted && devis.Valid && (
            <button
              onClick={handleConvert}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 font-bold animate-pulse-slow"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Transformer en BC
            </button>
          )}
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-bold">
            <PrinterIcon className="h-5 w-5 mr-2" />
            Imprimer PDF
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Info & Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Devis N° {devis.Prfx}{devis.Nf}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Crée le {formatDate(devis.DatUser)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  devis.Valid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                )}>
                  {devis.Valid ? "Validé" : "Brouillon"}
                </span>
                {devis.IsConverted && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    Converti
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Commercial</p>
                <p className="font-medium text-slate-800">{devis.DesRepres || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Référence</p>
                <p className="font-medium text-slate-800">{devis.Guid.substring(0, 8)}...</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Remarques</p>
                <p className="text-slate-800 mt-1">{devis.Remarq || 'Aucune remarque'}</p>
              </div>
            </div>
          </div>

          {/* Client Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Informations Client</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Client</p>
                <button
                  onClick={() => navigate(`/clients/1`)}
                  className="font-bold text-primary-600 text-lg hover:underline transition-all"
                >
                  {devis.LibTiers}
                </button>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Code Tiers</p>
                <p className="font-mono text-slate-800 bg-gray-50 px-2 py-0.5 rounded w-fit">{devis.CodTiers}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Adresse & Ville</p>
                <p className="font-medium text-slate-800 whitespace-pre-line">
                  {[devis.Adresse, devis.Ville].filter(Boolean).join('\n')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Matricule Fiscale / CIN</p>
                <p className="font-medium text-slate-800">{devis.Cin || '1234567/A/M/000'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Financials & IA) */}
        <div className="space-y-6">
          {/* Financials Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Totaux</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium text-slate-800">{formatCurrency(devis.TotHT)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Remise</span>
                <span className="text-red-600">-{formatCurrency(devis.TotRem)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Net HT</span>
                <span className="font-medium text-slate-800">{formatCurrency(devis.NetHT)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA</span>
                <span className="font-medium text-slate-800">{formatCurrency(devis.TotTva)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Timbre</span>
                <span className="font-medium text-slate-800">{formatCurrency(devis.Timbre)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-800">Total TTC</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(devis.TotTTC)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* IA Predictions Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm p-6 border border-indigo-100">
            <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <span>🤖</span> Analyse IA
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-indigo-700 font-medium">Probabilité de conversion</span>
                  <span className="text-indigo-900 font-bold">{devis.IA_Probabilite || 0}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${devis.IA_Probabilite || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-3 text-sm text-indigo-800">
                <p>
                  {devis.IA_Probabilite > 70
                    ? "Ce devis a de fortes chances d'être accepté. Priorisez le suivi."
                    : devis.IA_Probabilite > 40
                      ? "Probabilité moyenne. Une relance pourrait aider."
                      : "Faible probabilité. Vérifiez les besoins du client."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisDetail;

