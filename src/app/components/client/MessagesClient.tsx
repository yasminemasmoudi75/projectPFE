import { useState, useRef, useEffect } from 'react';
import { Mail, Send, Sparkles, Bot, User, RotateCcw, Paperclip, ChevronDown } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

/* ── Mock data ─────────────────────────────────── */
const contacts = [
  'support@nexuscrm.ma',
  'commercial@nexuscrm.ma',
  'technicien@nexuscrm.ma',
  'admin@nexuscrm.ma',
];

const initialChat: { role: 'bot' | 'user'; text: string }[] = [
  { role: 'bot', text: 'Bonjour ! Je suis votre assistant IA. Je peux vous aider à rédiger ou reformuler vos emails. Décrivez ce que vous souhaitez envoyer.' },
];

const reformulations = [
  (t: string) =>
    `Madame, Monsieur,\n\nJe me permets de vous contacter afin de ${t.toLowerCase().replace(/^je veux |^je souhaite |^bonjour,?\s*/i, '')}.\n\nDans l'attente de votre retour, je reste disponible pour tout renseignement complémentaire.\n\nCordialement,\nSociété Cliente`,
  (t: string) =>
    `Bonjour,\n\nSuite à notre dernier échange, je souhaite vous informer que ${t.toLowerCase()}.\n\nMerci de bien vouloir prendre en compte cette demande dans les meilleurs délais.\n\nBien cordialement,\nSociété Cliente`,
];

const botReplies: Record<string, string> = {
  default: 'Bien sûr ! Pouvez-vous me donner plus de détails sur le contenu de votre email ?',
  reformuler: "J'ai reformulé votre message de manière professionnelle. Cliquez sur le bouton « Reformuler » au-dessus de la zone de rédaction pour générer une nouvelle version.",
  objet: 'Pour l\'objet, je vous suggère quelque chose de concis comme : « Demande d\'intervention – [référence] » ou « Suivi réclamation REC-XXX ».',
  bonjour: 'Bonjour ! Comment puis-je vous aider pour votre email aujourd\'hui ?',
  merci: 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions.',
};

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('reformul')) return botReplies.reformuler;
  if (lower.includes('objet') || lower.includes('sujet')) return botReplies.objet;
  if (lower.includes('bonjour') || lower.includes('salut')) return botReplies.bonjour;
  if (lower.includes('merci')) return botReplies.merci;
  return botReplies.default;
}

/* ── Component ─────────────────────────────────── */
export function MessagesClient() {
  // Email form
  const [to, setTo]           = useState('');
  const [objet, setObjet]     = useState('');
  const [body, setBody]       = useState('');
  const [reformulating, setReformulating] = useState(false);
  const [reformCount, setReformCount]     = useState(0);
  const [sent, setSent]       = useState(false);

  // Chatbot
  const [chatMessages, setChatMessages] = useState(initialChat);
  const [chatInput, setChatInput]       = useState('');
  const [botTyping, setBotTyping]       = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, botTyping]);

  /* Reformuler */
  const handleReformuler = () => {
    if (!body.trim()) return;
    setReformulating(true);
    setTimeout(() => {
      const fn = reformulations[reformCount % reformulations.length];
      setBody(fn(body));
      setReformCount(c => c + 1);
      setReformulating(false);
    }, 1200);
  };

  /* Send email */
  const handleSend = () => {
    if (!to || !objet || !body) return;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setTo(''); setObjet(''); setBody('');
  };

  /* Chat send */
  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      setChatMessages(prev => [...prev, { role: 'bot', text: getBotReply(text) }]);
    }, 900);
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Messages</h1>
            <p className="text-sm text-slate-500">Envoyez un email et utilisez l'assistant IA pour vous aider</p>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {sent && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-sm font-medium text-emerald-700 flex items-center gap-2">
          <Send className="w-4 h-4" /> Message envoyé avec succès !
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* ── Email compose panel (3/5) ── */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Nouveau message</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* To */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">À</label>
              <div className="relative">
                <input
                  type="email"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  list="contacts-list"
                  placeholder="destinataire@exemple.com"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
                <datalist id="contacts-list">
                  {contacts.map(c => <option key={c} value={c} />)}
                </datalist>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>

            {/* Objet */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Objet</label>
              <input
                type="text"
                value={objet}
                onChange={e => setObjet(e.target.value)}
                placeholder="Objet de votre message"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* Toolbar + Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</label>
                <button
                  onClick={handleReformuler}
                  disabled={!body.trim() || reformulating}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all',
                    body.trim() && !reformulating
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  )}
                >
                  {reformulating ? (
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {reformulating ? 'Reformulation…' : 'Reformuler avec IA'}
                </button>
              </div>
              <textarea
                rows={10}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Rédigez votre message ici, ou décrivez votre besoin dans le chat IA à droite…"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
                <Paperclip className="w-3.5 h-3.5" /> Joindre un fichier
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { setTo(''); setObjet(''); setBody(''); }}
                  className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={!to || !objet || !body}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors',
                    to && objet && body
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-3.5 h-3.5" /> Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chatbot panel (2/5) ── */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '520px' }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Assistant IA</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" /> En ligne
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '380px' }}>
            {chatMessages.map((m, i) => (
              <div key={i} className={cn('flex gap-2.5', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  m.role === 'bot' ? 'bg-blue-100' : 'bg-slate-200'
                )}>
                  {m.role === 'bot'
                    ? <Bot className="w-3.5 h-3.5 text-blue-600" />
                    : <User className="w-3.5 h-3.5 text-slate-600" />
                  }
                </div>
                <div className={cn(
                  'max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
                  m.role === 'bot'
                    ? 'bg-slate-100 text-slate-700 rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                )}>
                  {m.text}
                </div>
              </div>
            ))}

            {botTyping && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="bg-slate-100 px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-slate-100 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                placeholder="Posez une question à l'IA…"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim()}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  chatInput.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
