import { useState } from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import SignaturePad from './SignaturePad';
import api from '../../app/axios';
import toast from 'react-hot-toast';

/**
 * signatureLabel    : texte du bloc principal (ex. "Signature du responsable")
 * counterLabel      : texte du bloc contre-signature (ex. "Cachet & Signature client")
 * canSign           : l'utilisateur peut signer le bloc principal
 * apiPath           : ex. "/bcv/{id}/signature"
 * initialSig        : valeur actuelle du bloc principal (base64 ou null)
 * canCounterSign    : l'utilisateur peut signer le bloc contre-signature
 * counterApiPath    : ex. "/bcv/{id}/client-signature"
 * initialCounterSig : valeur actuelle du bloc contre-signature (base64 ou null)
 */
const SignatureBlock = ({
  signatureLabel,
  counterLabel,
  canSign,
  apiPath,
  initialSig,
  canCounterSign,
  counterApiPath,
  initialCounterSig,
}) => {
  const [signature, setSignature]           = useState(initialSig || null);
  const [counterSignature, setCounterSig]   = useState(initialCounterSig || null);
  const [showPad, setShowPad]               = useState(false);
  const [showCounterPad, setShowCounterPad] = useState(false);

  const handleSave = async (dataUrl) => {
    try {
      await api.patch(apiPath, { signatureData: dataUrl });
      setSignature(dataUrl);
      setShowPad(false);
      toast.success('Signature enregistrée');
    } catch {
      toast.error('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(apiPath);
      setSignature(null);
      toast.success('Signature supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCounterSave = async (dataUrl) => {
    try {
      await api.patch(counterApiPath, { signatureData: dataUrl });
      setCounterSig(dataUrl);
      setShowCounterPad(false);
      toast.success('Signature enregistrée');
    } catch {
      toast.error('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const handleCounterDelete = async () => {
    try {
      await api.delete(counterApiPath);
      setCounterSig(null);
      toast.success('Signature supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <>
      {showPad && <SignaturePad onSave={handleSave} onClose={() => setShowPad(false)} />}
      {showCounterPad && <SignaturePad onSave={handleCounterSave} onClose={() => setShowCounterPad(false)} />}

      <div className="mt-10 pt-8 border-t border-slate-100">
        <div className="flex items-start justify-between gap-8">

          {/* Bloc signataire principal */}
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              {signatureLabel}
            </p>
            {signature ? (
              <div className="relative group inline-block">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <img src={signature} alt="Signature" className="h-20 max-w-[220px] object-contain" />
                </div>
                {canSign && (
                  <button
                    onClick={handleDelete}
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer">
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => canSign && setShowPad(true)}
                className={`w-48 h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center ${canSign ? 'cursor-pointer hover:border-[#0062AF]/50 hover:bg-[#f0f7ff] transition-colors' : ''}`}>
                <div className="text-center">
                  <PencilSquareIcon className="h-5 w-5 text-slate-300 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400">{canSign ? 'Cliquer pour signer' : 'Non signé'}</p>
                </div>
              </div>
            )}
            {canSign && signature && (
              <button
                onClick={() => setShowPad(true)}
                className="mt-2 text-[10px] text-[#0062AF] hover:underline font-medium">
                Modifier la signature
              </button>
            )}
          </div>

          {/* Bloc contre-signature */}
          {counterLabel && (
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {counterLabel}
              </p>
              {counterSignature ? (
                <div className="relative group inline-block">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <img src={counterSignature} alt="Signature client" className="h-20 max-w-[220px] object-contain" />
                  </div>
                  {canCounterSign && (
                    <button
                      onClick={handleCounterDelete}
                      className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer">
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => canCounterSign && setShowCounterPad(true)}
                  className={`w-48 h-20 border-2 border-dashed rounded-xl flex items-center justify-center ${canCounterSign ? 'border-slate-200 cursor-pointer hover:border-[#0062AF]/50 hover:bg-[#f0f7ff] transition-colors' : 'border-slate-100'}`}>
                  {canCounterSign && (
                    <div className="text-center">
                      <PencilSquareIcon className="h-5 w-5 text-slate-300 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400">Cliquer pour signer</p>
                    </div>
                  )}
                </div>
              )}
              {canCounterSign && counterSignature && (
                <button
                  onClick={() => setShowCounterPad(true)}
                  className="mt-2 text-[10px] text-[#0062AF] hover:underline font-medium">
                  Modifier la signature
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default SignatureBlock;
