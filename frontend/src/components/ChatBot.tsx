import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
  actions?: { label: string; path: string }[];
}

const QUICK_REPLIES = [
  'How do I scan a QR code?',
  'How to add a new fitting?',
  'What is AI Analytics?',
  'Show me the alerts',
  'How to generate QR codes?',
];

function getBotResponse(input: string): Message {
  const q = input.toLowerCase();

  if (q.includes('scan') || q.includes('qr code') || q.includes('camera')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'To scan a QR code, go to the Scan QR page. You can use your laptop camera to auto-detect QR codes, or enter the QR data manually. The system will look up the fitting and show its full digital passport.',
      actions: [{ label: 'Open Scanner', path: '/scan' }],
    };
  }

  if (q.includes('add') && (q.includes('fitting') || q.includes('asset') || q.includes('new'))) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'To add a new track fitting, go to Track Assets and click the "+" button. You\'ll need to enter the fitting type, zone, division, route, and vendor details. The system will generate a unique fitting code.',
      actions: [{ label: 'Open Assets', path: '/fittings' }],
    };
  }

  if (q.includes('generate') || q.includes('create qr') || q.includes('print')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'To generate and print QR codes for fittings, go to the QR Generate page. Select one or more fittings, choose label format (40mm or 50mm), and download the print-ready sheet.',
      actions: [{ label: 'Generate QR Codes', path: '/qr-generate' }],
    };
  }

  if (q.includes('ai') || q.includes('analytics') || q.includes('prediction') || q.includes('insight')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'The AI Analytics page provides risk predictions, defect insights, and maintenance forecasts for track fittings. You can view per-fitting risk analysis, trend insights, and 5-year maintenance forecasts.',
      actions: [{ label: 'Open AI Analytics', path: '/ai' }],
    };
  }

  if (q.includes('alert') || q.includes('notification')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'Alerts notify you about critical conditions like wear, cracks, or loose bolts. You can acknowledge or resolve alerts from the Alerts page. Unresolved critical alerts are highlighted on the dashboard.',
      actions: [{ label: 'View Alerts', path: '/alerts' }],
    };
  }

  if (q.includes('maintenance') || q.includes('ticket') || q.includes('repair')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'Maintenance tickets track repair work for fittings. View, create, and manage tickets from the Maintenance page. Each ticket links to a fitting and tracks status from OPEN to CLOSED.',
      actions: [{ label: 'Open Maintenance', path: '/maintenance' }],
    };
  }

  if (q.includes('inspection')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'Inspections are scheduled checks on track fittings. You can view all inspections, their status (Scheduled, In Progress, Completed, Overdue), and health scores on the Inspections page.',
      actions: [{ label: 'View Inspections', path: '/inspections' }],
    };
  }

  if (q.includes('map') || q.includes('location') || q.includes('gps')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'The Map page shows all tracked fittings on an interactive railway network map. Each marker represents a fitting with its health status color-coded: green for healthy, amber for attention, red for critical.',
      actions: [{ label: 'Open Map', path: '/map' }],
    };
  }

  if (q.includes('report') || q.includes('export') || q.includes('download')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'The Reports page offers Asset Health, Maintenance, Inspection Compliance, Vendor Quality, and Zone Performance reports. You can export data as CSV from most pages.',
      actions: [{ label: 'Open Reports', path: '/reports' }],
    };
  }

  if (q.includes('setting') || q.includes('profile') || q.includes('account') || q.includes('password')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'The Settings page shows your profile, account details, and system preferences. You can view your role and access level from there.',
      actions: [{ label: 'Open Settings', path: '/settings' }],
    };
  }

  if (q.includes('dashboard') || q.includes('home') || q.includes('overview')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'The Dashboard gives you a real-time overview: KPI cards for fittings, inspections, maintenance, and alerts. Plus trends, a railway map, AI insights, and a live alert center.',
      actions: [{ label: 'Go to Dashboard', path: '/' }],
    };
  }

  if (q.includes('login') || q.includes('sign in') || q.includes('credential') || q.includes('password')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'Demo credentials: Admin (admin@railsaathi.in / Admin@123), Inspector (inspector1@railsaathi.in / Inspector@123), Maintenance (maint1@railsaathi.in / Maint@123). All demo passwords use Titlecase + @123.',
    };
  }

  if (q.includes('help') || q.includes('what can') || q.includes('how to') || q.includes('guide')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'I can help you navigate RailSaathi! Here are some things you can ask me about:',
      actions: [
        { label: 'Scanning QR Codes', path: '/scan' },
        { label: 'Track Assets', path: '/fittings' },
        { label: 'AI Analytics', path: '/ai' },
        { label: 'Dashboard', path: '/' },
      ],
    };
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste')) {
    return {
      id: Date.now(),
      role: 'bot',
      text: 'Namaste! I\'m RailSaathi Assistant. I can help you navigate the app, explain features, or guide you through tasks. What would you like to know?',
    };
  }

  return {
    id: Date.now(),
    role: 'bot',
    text: 'I can help you with scanning QR codes, managing assets, viewing alerts, AI analytics, maintenance, inspections, reports, and more. Try asking about a specific feature!',
    actions: [
      { label: 'Scan QR', path: '/scan' },
      { label: 'Dashboard', path: '/' },
      { label: 'Alerts', path: '/alerts' },
    ],
  };
}

export default function ChatBot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'bot',
      text: 'Namaste! I\'m RailSaathi Assistant. How can I help you today?',
      actions: [
        { label: 'How to scan QR', path: '/scan' },
        { label: 'View Dashboard', path: '/' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, getBotResponse(text)]);
    }, 300);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl border border-slate-200 bg-white flex flex-col overflow-hidden"
            style={{ height: '480px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-rail-blue px-4 py-3 text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">RailSaathi Assistant</p>
                  <p className="text-[10px] text-white/70">Ask me anything about the app</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/20 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                      msg.role === 'user' ? 'bg-rail-blue' : 'bg-slate-500'
                    }`}>
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <div>
                      <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-rail-blue text-white rounded-tr-sm'
                          : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {msg.actions.map((a) => (
                            <button
                              key={a.path}
                              onClick={() => { navigate(a.path); setOpen(false); }}
                              className="px-2 py-0.5 text-[10px] font-medium text-rail-blue bg-rail-blue/10 rounded-full hover:bg-rail-blue/20 transition-colors"
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-1 px-4 pb-2 shrink-0">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => send(qr)}
                    className="px-2 py-0.5 text-[10px] text-rail-blue border border-rail-blue/30 rounded-full hover:bg-rail-blue/5 transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Type your question..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="rounded-lg bg-rail-blue p-1.5 text-white hover:bg-rail-blue/90 disabled:opacity-40 transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-rail-blue text-white shadow-lg hover:bg-rail-blue/90 hover:shadow-xl transition-all"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
}
