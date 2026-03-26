'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Send,
  Mic,
  Paperclip,
  Heart,
  ChevronLeft,
  Plus,
  Volume2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  sendMessage as sendChatMessage,
  getChatSessions,
  getSessionHistory,
} from '@/lib/services/chat.service';

// ─── Types ────────────────────────────────────────────────────────────────────
type MessageType = 'ai' | 'patient' | 'teachback';

interface Message {
  id: number;
  type: MessageType;
  text: string;
  time: string;
}

interface Session {
  id: string;
  title: string;
  time: string;
  active: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatSessionTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatMsgTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

function getUserInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1"
        style={{ backgroundColor: 'var(--brand-primary-purple)' }}
      >
        <Heart className="w-3.5 h-3.5 text-white" />
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
        style={{
          backgroundColor: 'white',
          boxShadow: 'var(--brand-shadow-card)',
          borderRadius: '16px 16px 16px 4px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--brand-primary-purple)' }}
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  if (msg.type === 'patient') {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className="max-w-[55%] px-4 py-3 relative"
          style={{
            backgroundColor: 'var(--brand-primary-purple)',
            borderRadius: '16px 16px 4px 16px',
            color: 'white',
          }}
        >
          <p className="text-[14px] leading-relaxed">{msg.text}</p>
          <p className="text-[10px] mt-1.5 text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {msg.time}
          </p>
        </div>
      </motion.div>
    );
  }

  if (msg.type === 'teachback') {
    return (
      <motion.div
        className="flex items-end gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1"
          style={{ backgroundColor: 'var(--brand-primary-purple)' }}
        >
          <Heart className="w-3.5 h-3.5 text-white" />
        </div>
        <div
          className="max-w-[65%] px-4 py-3"
          style={{
            backgroundColor: 'var(--brand-accent-teal-light)',
            borderRadius: '16px 16px 16px 4px',
            borderLeft: '3px solid var(--brand-accent-teal)',
          }}
        >
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold mb-2"
            style={{ backgroundColor: 'var(--brand-accent-teal)', color: 'white' }}
          >
            Comprehension Check
          </span>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--brand-text-primary)' }}>
            {msg.text}
          </p>
          <p className="text-[10px] mt-1.5 text-right" style={{ color: 'var(--brand-text-muted)' }}>
            {msg.time}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-end gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1"
        style={{ backgroundColor: 'var(--brand-primary-purple)' }}
      >
        <Heart className="w-3.5 h-3.5 text-white" />
      </div>
      <div
        className="max-w-[65%] px-4 py-3"
        style={{
          backgroundColor: 'white',
          boxShadow: 'var(--brand-shadow-card)',
          borderRadius: '16px 16px 16px 4px',
        }}
      >
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--brand-text-primary)' }}>
          {msg.text}
        </p>
        <p className="text-[10px] mt-1.5 text-right" style={{ color: 'var(--brand-text-muted)' }}>
          {msg.time}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNewConversation,
  userInitials,
  userName,
  riskTier,
}: {
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  userInitials: string;
  userName: string;
  riskTier: string;
}) {
  const riskColor =
    riskTier === 'HIGH'
      ? { bg: 'var(--brand-alert-red-light)', text: 'var(--brand-alert-red)' }
      : riskTier === 'ELEVATED'
      ? { bg: 'var(--brand-warning-amber-light)', text: 'var(--brand-warning-amber)' }
      : { bg: 'var(--brand-success-green-light)', text: 'var(--brand-success-green)' };

  return (
    <div
      className="hidden lg:flex flex-col w-70 shrink-0 h-full"
      style={{ backgroundColor: 'white', borderRight: '1px solid var(--brand-border)' }}
    >
      <div className="p-5 flex-1 flex flex-col overflow-hidden">
        <h2 className="text-[16px] font-semibold mb-4 shrink-0" style={{ color: 'var(--brand-text-primary)' }}>
          Conversations
        </h2>

        {/* Patient context card */}
        <div className="rounded-xl p-3.5 mb-4 shrink-0" style={{ backgroundColor: 'var(--brand-primary-purple-light)' }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
              style={{ backgroundColor: 'var(--brand-primary-purple)' }}
            >
              {userInitials}
            </div>
            <div>
              <p className="text-[13px] font-bold" style={{ color: 'var(--brand-text-primary)' }}>{userName}</p>
              <p className="text-[12px] font-semibold" style={{ color: 'var(--brand-accent-teal)' }}>Patient</p>
            </div>
          </div>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ backgroundColor: riskColor.bg, color: riskColor.text }}
          >
            {riskTier} risk
          </span>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {sessions.length === 0 && (
            <p className="text-[12px] px-2" style={{ color: 'var(--brand-text-muted)' }}>
              No conversations yet
            </p>
          )}
          {sessions.map((s) => {
            const isActive = s.id === activeId;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--brand-primary-purple-light)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--brand-primary-purple)' : '3px solid transparent',
                }}
              >
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: isActive ? 'var(--brand-text-primary)' : 'var(--brand-text-secondary)' }}
                >
                  {s.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>{s.time}</p>
              </button>
            );
          })}
        </div>

        <button
          onClick={onNewConversation}
          className="mt-4 shrink-0 flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-80"
          style={{ color: 'var(--brand-accent-teal)' }}
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIChatInterface() {
  const router = useRouter();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userInitials = getUserInitials(user?.name);
  const userName = user?.name ?? 'Patient';
  const riskTier = user?.riskTier ?? 'STANDARD';

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load sessions on mount
  useEffect(() => {
    getChatSessions()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const mapped: Session[] = arr.map((s: { id: string; title: string; updatedAt: string; createdAt: string }) => ({
          id: s.id,
          title: s.title || 'Conversation',
          time: formatSessionTime(s.updatedAt ?? s.createdAt),
          active: false,
        }));
        setSessions(mapped);
        if (mapped.length > 0 && !activeSessionId) {
          setActiveSessionId(mapped[0].id);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load history when session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    getSessionHistory(activeSessionId)
      .then((history) => {
        const arr = Array.isArray(history) ? history : [];
        const msgs: Message[] = [];
        arr.forEach((item: { id: string; userMessage: string; aiResponse: string; timestamp: string }, idx: number) => {
          msgs.push({
            id: idx * 2,
            type: 'patient',
            text: item.userMessage,
            time: formatMsgTime(item.timestamp),
          });
          msgs.push({
            id: idx * 2 + 1,
            type: 'ai',
            text: item.aiResponse,
            time: formatMsgTime(item.timestamp),
          });
        });
        setMessages(msgs);
      })
      .catch(() => {
        setMessages([]);
      });
  }, [activeSessionId]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const userMsg: Message = { id: Date.now(), type: 'patient', text, time: timeStr };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setIsSending(true);

    try {
      const response = await sendChatMessage(text, activeSessionId ?? undefined);
      setIsTyping(false);

      // If a new session was created, update state and refresh sessions
      if (!activeSessionId && response.sessionId) {
        setActiveSessionId(response.sessionId);
        getChatSessions()
          .then((data) => {
            const arr = Array.isArray(data) ? data : [];
            setSessions(
              arr.map((s: { id: string; title: string; updatedAt: string; createdAt: string }) => ({
                id: s.id,
                title: s.title || 'Conversation',
                time: formatSessionTime(s.updatedAt ?? s.createdAt),
                active: false,
              })),
            );
          })
          .catch(() => {});
      }

      const aiMsg: Message = {
        id: Date.now() + 1,
        type: response.isEmergency ? 'teachback' : 'ai',
        text: response.data,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setIsTyping(false);
      const errMsg: Message = {
        id: Date.now() + 1,
        type: 'ai',
        text: 'Sorry, I had trouble connecting. Please try again.',
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleNewConversation = () => {
    setActiveSessionId(null);
    setMessages([]);
    setShowSessions(false);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setShowSessions(false);
  };

  const navItems = ['Home', 'Check-In', 'Chat', 'History'];
  const navRoutes: Record<string, string> = {
    Home: '/dashboard',
    'Check-In': '/check-in',
    Chat: '/chat',
    History: '#',
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--brand-background)' }}>
      {/* Top Nav */}
      <nav
        className="bg-white h-16 flex items-center justify-between px-4 md:px-8 shrink-0 z-30"
        style={{ borderBottom: '1px solid var(--brand-border)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Healplace logo" width={36} height={36} className="w-9 h-9" />
          <span className="hidden md:block font-bold text-lg" style={{ color: 'var(--brand-primary-purple)' }}>
            Healplace Cardio
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = item === 'Chat';
            return (
              <button
                key={item}
                onClick={() => {
                  if (navRoutes[item] !== '#') router.push(navRoutes[item]);
                }}
                className="text-sm font-semibold pb-1 relative transition"
                style={{ color: isActive ? 'var(--brand-primary-purple)' : 'var(--brand-text-secondary)' }}
              >
                {item}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: 'var(--brand-primary-purple)' }} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="lg:hidden flex items-center gap-1 text-[13px] font-semibold"
            style={{ color: 'var(--brand-primary-purple)' }}
            onClick={() => setShowSessions((s) => !s)}
          >
            <ChevronLeft className="w-4 h-4" />
            Sessions
          </button>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
            style={{ backgroundColor: 'var(--brand-primary-purple)' }}
          >
            {userInitials}
          </div>
        </div>
      </nav>

      {/* Split layout */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          sessions={sessions}
          activeId={activeSessionId}
          onSelect={handleSelectSession}
          onNewConversation={handleNewConversation}
          userInitials={userInitials}
          userName={userName}
          riskTier={riskTier}
        />

        {/* Mobile sessions drawer */}
        <AnimatePresence>
          {showSessions && (
            <>
              <motion.div
                className="lg:hidden fixed inset-0 z-40 bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSessions(false)}
              />
              <motion.div
                className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col"
                style={{ backgroundColor: 'white' }}
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              >
                <div
                  className="h-16 flex items-center px-5 shrink-0"
                  style={{ borderBottom: '1px solid var(--brand-border)' }}
                >
                  <h2 className="text-[16px] font-semibold" style={{ color: 'var(--brand-text-primary)' }}>
                    Conversations
                  </h2>
                </div>
                <div className="p-4 flex-1 flex flex-col overflow-hidden">
                  <div className="rounded-xl p-3.5 mb-4 shrink-0" style={{ backgroundColor: 'var(--brand-primary-purple-light)' }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                        style={{ backgroundColor: 'var(--brand-primary-purple)' }}
                      >
                        {userInitials}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color: 'var(--brand-text-primary)' }}>{userName}</p>
                        <p className="text-[12px] font-semibold" style={{ color: 'var(--brand-accent-teal)' }}>Patient</p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: 'var(--brand-success-green-light)', color: 'var(--brand-success-green)' }}
                    >
                      {riskTier} risk
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {sessions.length === 0 && (
                      <p className="text-[12px] px-2" style={{ color: 'var(--brand-text-muted)' }}>
                        No conversations yet
                      </p>
                    )}
                    {sessions.map((s) => {
                      const isActive = s.id === activeSessionId;
                      return (
                        <button
                          key={s.id}
                          onClick={() => { setActiveSessionId(s.id); setShowSessions(false); }}
                          className="w-full text-left px-3 py-2.5 rounded-lg"
                          style={{
                            backgroundColor: isActive ? 'var(--brand-primary-purple-light)' : 'transparent',
                            borderLeft: isActive ? '3px solid var(--brand-primary-purple)' : '3px solid transparent',
                          }}
                        >
                          <p className="text-[13px] font-semibold" style={{ color: isActive ? 'var(--brand-text-primary)' : 'var(--brand-text-secondary)' }}>
                            {s.title}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>{s.time}</p>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleNewConversation}
                    className="mt-4 shrink-0 flex items-center gap-1.5 text-[13px] font-semibold"
                    style={{ color: 'var(--brand-accent-teal)' }}
                  >
                    <Plus className="w-4 h-4" />
                    New conversation
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Chat header */}
          <div
            className="bg-white flex items-center justify-between px-5 lg:px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--brand-border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--brand-primary-purple)' }}
              >
                <Heart className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: 'var(--brand-text-primary)' }}>
                  Healplace Cardio AI
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  <span className="text-[12px]" style={{ color: 'var(--brand-text-muted)' }}>Online</span>
                </div>
              </div>
            </div>
            <span
              className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold"
              style={{ backgroundColor: 'var(--brand-accent-teal-light)', color: 'var(--brand-accent-teal)' }}
            >
              Patient context loaded
            </span>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4 min-h-0"
            style={{ backgroundColor: 'var(--brand-background)' }}
          >
            {messages.length === 0 && !isTyping && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'var(--brand-primary-purple-light)' }}
                  >
                    <Heart className="w-8 h-8" style={{ color: 'var(--brand-primary-purple)' }} />
                  </div>
                  <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--brand-text-primary)' }}>
                    How can I help you today?
                  </p>
                  <p className="text-[13px]" style={{ color: 'var(--brand-text-muted)' }}>
                    Ask me about your blood pressure, medications, or symptoms.
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <AnimatePresence>
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Audio mode banner */}
          <div
            className="shrink-0 flex items-center justify-between px-5 lg:px-6 py-2.5"
            style={{
              backgroundColor: 'var(--brand-primary-purple-ultra-light)',
              borderTop: '1px solid var(--brand-border)',
              borderBottom: '1px solid var(--brand-border)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Volume2 className="w-4 h-4 shrink-0" style={{ color: 'var(--brand-primary-purple)' }} />
              <div className="min-w-0">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--brand-text-primary)' }}>
                  Audio mode available
                </span>
                <span className="hidden sm:inline text-[13px] ml-2" style={{ color: 'var(--brand-text-muted)' }}>
                  Tap the mic to speak your answers instead of typing
                </span>
              </div>
            </div>
            <button
              className="shrink-0 flex items-center gap-1 text-[13px] font-semibold ml-3 transition hover:opacity-80"
              style={{ color: 'var(--brand-primary-purple)' }}
            >
              Switch to audio
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Input bar */}
          <div
            className="shrink-0 bg-white px-4 lg:px-6 pt-3 pb-4"
            style={{ borderTop: '1px solid var(--brand-border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex-1 flex items-center gap-2 px-4"
                style={{
                  height: 48,
                  border: '1px solid var(--brand-border)',
                  borderRadius: 'var(--brand-radius-pill)',
                  backgroundColor: 'white',
                }}
              >
                <Paperclip className="w-4 h-4 shrink-0" style={{ color: 'var(--brand-text-muted)' }} />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 outline-none bg-transparent text-[14px] min-w-0"
                  style={{ color: 'var(--brand-text-primary)' }}
                  disabled={isSending}
                />
                <button className="shrink-0 transition hover:opacity-70">
                  <Mic className="w-4 h-4" style={{ color: 'var(--brand-primary-purple)' }} />
                </button>
              </div>
              <motion.button
                onClick={() => void handleSend()}
                disabled={isSending || !inputValue.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
                style={{
                  backgroundColor: inputValue.trim() ? 'var(--brand-primary-purple)' : 'var(--brand-border)',
                  boxShadow: inputValue.trim() ? 'var(--brand-shadow-button)' : 'none',
                  transition: 'background-color 0.2s, box-shadow 0.2s',
                }}
                whileHover={inputValue.trim() ? { scale: 1.08 } : {}}
                whileTap={inputValue.trim() ? { scale: 0.93 } : {}}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
            <p className="text-center text-[10px] mt-2" style={{ color: 'var(--brand-text-muted)' }}>
              Healplace Cardio AI &middot; Monitored by care team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
