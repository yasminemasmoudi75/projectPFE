import { useRef, useState, useEffect, useCallback } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';
import { XMarkIcon, ArrowUturnLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

const SignaturePad = ({ onSave, onClose }) => {
  const sigRef      = useRef(null);
  const containerRef = useRef(null);
  const [hasDrawn, setHasDrawn]   = useState(false);
  const [canvasW, setCanvasW]     = useState(460);

  // Mesure la largeur réelle du conteneur pour aligner le canvas
  const measureContainer = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      if (w > 0) setCanvasW(w);
    }
  }, []);

  useEffect(() => {
    measureContainer();
    window.addEventListener('resize', measureContainer);
    return () => window.removeEventListener('resize', measureContainer);
  }, [measureContainer]);

  const handleClear = () => {
    sigRef.current?.clear();
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (!sigRef.current) return;
    // toDataURL direct — getTrimmedCanvas() casse avec Vite/trim-canvas ESM
    const canvas = sigRef.current.getCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Signature électronique</h3>
            <p className="text-xs text-slate-400 mt-0.5">Signez dans le cadre ci-dessous</p>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="px-6 py-4">
          <div
            ref={containerRef}
            className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 hover:border-[#0062AF]/40 transition-colors cursor-crosshair"
          >
            <ReactSignatureCanvas
              ref={sigRef}
              penColor="#1e293b"
              minWidth={1.5}
              maxWidth={3}
              canvasProps={{
                width:  canvasW,
                height: 180,
                style:  { display: 'block', width: '100%', height: '180px', touchAction: 'none' },
              }}
              onEnd={() => setHasDrawn(true)}
            />
          </div>

          {/* Indicateur visuel */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-slate-400">
              Tracez votre signature avec la souris ou le doigt
            </p>
            {hasDrawn && (
              <span className="text-[10px] text-emerald-600 font-semibold">✓ Signature détectée</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-100 transition-all">
            <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
            Effacer
          </button>
          <button
            onClick={handleSave}
            disabled={!hasDrawn}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm shadow-blue-500/20">
            <CheckIcon className="h-4 w-4" />
            Valider la signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
