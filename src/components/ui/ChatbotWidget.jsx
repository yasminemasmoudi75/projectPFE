import { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text: "Bonjour ! Je suis **NexusAI**, votre assistant intelligent.\nComment puis-je vous aider aujourd'hui ?",
  time: new Date(),
};

const TypingDots = () => (
  <div className="flex items-center gap-1 py-1 px-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

const renderText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

// ── Modal plein écran ──────────────────────────────────────────────────────
const TableModal = ({ tableData, title, onClose }) => {
  const [search, setSearch] = useState('');
  if (!tableData?.length) return null;
  const cols = Object.keys(tableData[0]);

  const filtered = search.trim()
    ? tableData.filter(row =>
        Object.values(row).some(v =>
          String(v).toLowerCase().includes(search.toLowerCase())
        )
      )
    : tableData;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header modal */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 flex-none">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{title || 'Résultats'}</p>
                <p className="text-xs text-blue-100">{filtered.length} résultat(s)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/25 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="px-6 py-3 border-b border-slate-100 flex-none">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filtrer les résultats..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tableau */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 border-b border-slate-200">
                  {cols.map(c => (
                    <th key={c} className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap uppercase tracking-wide text-xs">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                    {cols.map(c => (
                      <td key={c} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {row[c]}
                      </td>
                    ))}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={cols.length} className="px-4 py-8 text-center text-slate-400 text-sm">
                      Aucun résultat pour "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex-none text-xs text-slate-400">
            {filtered.length} / {tableData.length} résultat(s) affiché(s)
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Mini tableau dans la bulle ────────────────────────────────────────────
const DataTable = ({ tableData, onExpand }) => {
  if (!tableData?.length) return null;
  const cols = Object.keys(tableData[0]);
  const preview = tableData.slice(0, 5);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {cols.map(c => (
                <th key={c} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap uppercase tracking-wide text-[10px]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {preview.map((row, i) => (
              <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                {cols.map(c => (
                  <td key={c} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {row[c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{tableData.length} résultat(s)</span>
        <button
          onClick={onExpand}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
          Voir en grand
        </button>
      </div>
    </div>
  );
};

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [modal, setModal] = useState(null); // { tableData, title }
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 200);
      setHasNew(false);
    }
  }, [open, messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/ia/chat', { message: text });
      const payload = res?.data || res;
      const reply =
        payload?.reply ||
        payload?.message ||
        payload?.response ||
        (typeof payload === 'string' ? payload : null) ||
        'Je suis désolé, je ne peux pas répondre pour le moment.';
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: typeof reply === 'string' ? reply : JSON.stringify(reply),
        tableData: payload?.tableData || null,
        action: payload?.action || null,
        time: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      if (!open) setHasNew(true);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          time: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([WELCOME]);

  const fmt = (date) =>
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const suggestions = [
    'Créer un devis',
    'Devis en attente',
    'Factures impayées',
  ];

  return (
    <>
      {/* Modal plein écran */}
      {modal && (
        <TableModal
          tableData={modal.tableData}
          title={modal.title}
          onClose={() => setModal(null)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Chat window */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-[680px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col bg-white"
              style={{ height: '600px' }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 flex-none">
                <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center flex-none">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">NexusAI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-blue-100">En ligne</p>
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                  title="Effacer la conversation"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-none shadow-sm">
                        <SparklesIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'max-w-[70%] bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-br-sm'
                          : msg.isError
                          ? 'max-w-[85%] bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                          : msg.tableData
                          ? 'w-full bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                          : 'max-w-[85%] bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{renderText(msg.text)}</p>
                      {msg.tableData && (
                        <DataTable
                          tableData={msg.tableData}
                          onExpand={() => setModal({ tableData: msg.tableData, title: msg.text })}
                        />
                      )}
                      {msg.action?.type === 'navigate' && (
                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          onClick={() => { navigate(msg.action.path); setOpen(false); }}
                          className="mt-3 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                        >
                          <span>{msg.action.label}</span>
                          <ArrowRightIcon className="h-4 w-4 flex-none" />
                        </motion.button>
                      )}
                      <p
                        className={`text-[10px] mt-1.5 ${
                          msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                        }`}
                      >
                        {fmt(msg.time)}
                      </p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-end gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-none shadow-sm">
                      <SparklesIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2 shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex gap-1.5 flex-wrap bg-white border-t border-slate-100">
                  <p className="w-full text-xs text-slate-400 pt-2 pb-1">Suggestions rapides :</p>
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-3 pt-2 bg-white border-t border-slate-100 flex items-end gap-2 flex-none">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Écrivez votre message..."
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow disabled:opacity-60 max-h-24 overflow-y-auto"
                  style={{ lineHeight: '1.4' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="h-10 w-10 flex-none flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle FAB */}
        <motion.button
          onClick={() => setOpen(v => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <XMarkIcon className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <SparklesIcon className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Unread badge */}
          <AnimatePresence>
            {hasNew && !open && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white"
              />
            )}
          </AnimatePresence>

          {/* Ping ring */}
          {!open && (
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 animate-ping opacity-20 pointer-events-none" />
          )}
        </motion.button>
      </div>
    </>
  );
};

export default ChatbotWidget;
