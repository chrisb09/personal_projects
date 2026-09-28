import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import katex from 'katex';
import { 
  Sparkles, 
  X, 
  Send, 
  Square, 
  Trash2, 
  Bot, 
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Cpu,
  Clock,
  Zap,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  Globe,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasChatConsent, grantChatConsent, revokeChatConsent } from '@/lib/chatConsent';

// Configure marked for GitHub-Flavored Markdown
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface ChatSource {
  title: string;
  url: string;
  type: string;
}

interface ChatMessageMeta {
  model: string;
  durationMs: number;
  ttftMs?: number;
  inputTokens?: number;
  thinkingTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  tokensPerSec: number;
  costFormatted?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  meta?: ChatMessageMeta;
  sources?: ChatSource[];
}

const STORAGE_KEY = 'portfolio_chat_messages_v1';
const SESSION_ID_KEY = 'portfolio_chat_session_id_v1';

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return 'sess_' + Date.now().toString(36);
  }
}

// Large curated pool of 32 starter questions (bilingual)
const STARTER_QUESTIONS: { en: string; de: string }[] = [
  // Overview & Career / HR-friendly
  { en: "Can you give an overview of Christian's background and experience?", de: "Kannst du einen Überblick über Christians Werdegang und Erfahrung geben?" },
  { en: "What roles and responsibilities does Christian usually take on?", de: "Welche Rollen und Aufgaben übernimmt Christian typischerweise?" },
  { en: "What are Christian's core strengths and problem-solving approach?", de: "Was sind Christians größte Stärken und seine Herangehensweise?" },
  { en: "What was Christian's Master's thesis about and where did he study?", de: "Worum ging es in Christians Masterarbeit und wo hat er studiert?" },
  { en: "Which projects were collaborative team efforts vs. solo projects?", de: "Welche Projekte waren Teamarbeiten und welche Solo-Projekte?" },
  { en: "Summarize Christian's engineering profile in 3 concise points", de: "Fasse Christians Profil in 3 prägnanten Punkten zusammen" },
  { en: "What kind of engineering challenges does Christian find most exciting?", de: "Welche Software-Herausforderungen begeistern Christian am meisten?" },
  { en: "How does Christian approach testing and software quality?", de: "Wie geht Christian an Software-Qualität und Tests heran?" },

  // Tech Stacks & Languages
  { en: "Which projects use Python, C++, or TypeScript?", de: "Welche Projekte nutzen Python, C++ oder TypeScript?" },
  { en: "What is Christian's experience with C++ and high-performance computing?", de: "Was ist Christians Erfahrung mit C++ und High-Performance Computing?" },
  { en: "How has Christian used Python across ML, scraping, and backend tools?", de: "Wie setzt Christian Python für ML, Web-Scraping und Backends ein?" },
  { en: "Which projects showcase modern TypeScript and frontend engineering?", de: "Welche Projekte zeigen moderne TypeScript- und Frontend-Entwicklung?" },
  { en: "Tell me about Christian's experience with Java and high-concurrency systems", de: "Erzähle mir von Christians Erfahrung mit Java und hochgradig parallelen Systemen" },
  { en: "Which projects involve Linux packaging, systemd, or shell scripting?", de: "Welche Projekte nutzen Linux-Packaging, systemd oder Shell-Skripte?" },
  { en: "What databases and storage solutions does Christian work with?", de: "Mit welchen Datenbanken und Storage-Lösungen arbeitet Christian?" },
  { en: "What technologies does Christian use most across his repositories?", de: "Welche Technologien nutzt Christian am häufigsten?" },

  // Architecture & Deep Technical
  { en: "Explain the CPP-ML-Interface architecture and SmartSim coupling", de: "Erkläre die Architektur von CPP-ML-Interface und die SmartSim-Kopplung" },
  { en: "How does the JMusicBot fork support Discord's modern DAVE voice encryption?", de: "Wie unterstützt der JMusicBot-Fork Discords moderne DAVE-Verschlüsselung?" },
  { en: "What is the architecture of the LLM-Integrated Exam System?", de: "Wie ist die Architektur des LLM-integrierten Prüfungssystems aufgebaut?" },
  { en: "How does the Cycling Power Estimator calculate physics and render 3D maps?", de: "Wie berechnet der Cycling Power Estimator physikalische Werte und 3D-Karten?" },
  { en: "How does the Userbenchmark scraper coordinate distributed Tor proxies?", de: "Wie koordiniert der Userbenchmark-Scraper verteilte Tor-Proxys?" },
  { en: "How was the Ferienw-am-Meer frontend modernized for performance?", de: "Wie wurde das Ferienw-am-Meer Frontend für maximale Performance modernisiert?" },
  { en: "What machine learning models has Christian trained, fine-tuned, or deployed?", de: "Welche Machine-Learning-Modelle hat Christian trainiert oder eingesetzt?" },
  { en: "How does the 53-week contribution calendar discover multi-host activity?", de: "Wie erfasst der Beitrags-Kalender Aktivitäten über mehrere Git-Hosts?" },
  { en: "Tell me about Christian's private Linux homeserver and storage setup", de: "Erzähle mir von Christians privatem Linux-Homeserver und Storage-Setup" },
  { en: "What is OpenCode and how does Christian's auth plugin work?", de: "Was ist OpenCode und wie funktioniert Christians Auth-Plugin?" },
  { en: "What is firecord and how does its distributed memory model work?", de: "Was ist firecord und wie funktioniert das verteilte Speichermodell?" },
  { en: "How does the Minecraft chat translator achieve real-time translation?", de: "Wie erreicht der Minecraft-Chat-Translator bidirektionale Echtzeit-Übersetzung?" },

  // Quick Discovery
  { en: "What are Christian's most starred open-source projects?", de: "Was sind Christians am meisten mit Sternen bewertete Open-Source-Projekte?" },
  { en: "What tools and development environment does Christian use daily?", de: "Welche Tools und Entwicklungsumgebungen nutzt Christian täglich?" },
  { en: "Which projects are academic research vs. production applications?", de: "Welche Projekte sind akademische Forschung und welche produktive Anwendungen?" },
  { en: "How can I get in touch with Christian regarding work opportunities?", de: "Wie kann ich Christian bezüglich beruflicher Möglichkeiten kontaktieren?" },
];

function sampleRandomQuestions(lang: string, count = 4, exclude: string[] = []): string[] {
  const isDe = lang.startsWith('de');
  const available = STARTER_QUESTIONS
    .map(q => isDe ? q.de : q.en)
    .filter(q => !exclude.includes(q));

  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Markdown & LaTeX Math Formatter using marked and katex
function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    try {
      // 1. Pre-render block math: $$ ... $$
      const mathBlocks: string[] = [];
      let tokenized = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
          const id = `@@MATH_BLOCK_${mathBlocks.length}@@`;
          mathBlocks.push(rendered);
          return id;
        } catch {
          return `$$${math}$$`;
        }
      });

      // 2. Pre-render inline math: $ ... $
      const mathInlines: string[] = [];
      tokenized = tokenized.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (match, math) => {
        // Avoid replacing standalone currency like $50 or $100.00
        if (/^\d+(?:\.\d+)?$/.test(math.trim())) return match;
        try {
          const rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
          const id = `@@MATH_INLINE_${mathInlines.length}@@`;
          mathInlines.push(rendered);
          return id;
        } catch {
          return match;
        }
      });

      // 3. Parse markdown via marked
      let parsed = marked.parse(tokenized, { async: false, breaks: true, gfm: true }) as string;

      // 4. Re-inject rendered math
      mathBlocks.forEach((rendered, i) => {
        parsed = parsed.replace(
          `@@MATH_BLOCK_${i}@@`,
          `<div class="my-3 overflow-x-auto text-center py-2.5 px-3 rounded-xl bg-muted/40 border border-border/50 shadow-2xs">${rendered}</div>`
        );
      });

      mathInlines.forEach((rendered, i) => {
        parsed = parsed.replace(`@@MATH_INLINE_${i}@@`, rendered);
      });

      return parsed;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className="text-xs sm:text-sm leading-relaxed text-card-foreground break-words
        [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3.5 [&_h1]:mb-1.5 [&_h1]:text-indigo-500 dark:[&_h1]:text-indigo-400 [&_h1]:tracking-tight
        [&_h2]:text-sm sm:[&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-indigo-500 dark:[&_h2]:text-indigo-400
        [&_h3]:text-xs sm:[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:text-indigo-500 dark:[&_h3]:text-indigo-400
        [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-0.5 [&_h4]:text-indigo-500 dark:[&_h4]:text-indigo-400
        [&_p]:my-1.5 [&_p]:leading-relaxed
        [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1.5 [&_ul]:space-y-1
        [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1.5 [&_ol]:space-y-1
        [&_li]:my-0.5 [&_li]:leading-relaxed
        [&_strong]:font-semibold [&_strong]:text-amber-500 dark:[&_strong]:text-amber-300
        [&_b]:font-semibold [&_b]:text-amber-500 dark:[&_b]:text-amber-300
        [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:mx-0.5 [&_code]:rounded-md [&_code]:bg-emerald-500/10 [&_code]:border [&_code]:border-emerald-500/25 [&_code]:text-emerald-600 dark:[&_code]:text-emerald-400 [&_code]:font-mono [&_code]:text-[11px] [&_code]:font-medium
        [&_pre]:my-2.5 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:bg-neutral-950 [&_pre]:border [&_pre]:border-border [&_pre]:overflow-x-auto
        [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-neutral-200 [&_pre_code]:text-xs
        [&_a]:text-cyan-600 dark:[&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium hover:[&_a]:text-cyan-500 dark:hover:[&_a]:text-cyan-300 transition-colors
        [&_hr]:my-3 [&_hr]:border-border/60
        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2
        [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-border [&_table]:text-xs [&_table]:shadow-2xs
        [&_thead]:bg-muted/80 [&_thead]:border-b [&_thead]:border-border
        [&_th]:px-3.5 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-foreground [&_th]:text-left
        [&_tbody_tr]:border-b [&_tbody_tr]:border-border/40 [&_tbody_tr]:transition-colors hover:[&_tbody_tr]:bg-muted/30
        [&_td]:px-3.5 [&_td]:py-2 [&_td]:text-card-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export const ChatWidget: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [consentGiven, setConsentGiven] = useState<boolean>(() => hasChatConsent());
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Dynamic starter questions selection
  const [activeStarters, setActiveStarters] = useState<string[]>(() => 
    sampleRandomQuestions(i18n.language || 'en', 4)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync starters with language change
  useEffect(() => {
    setActiveStarters(sampleRandomQuestions(i18n.language || 'en', 4));
  }, [i18n.language]);

  const handleShuffleStarters = () => {
    setActiveStarters(prev => sampleRandomQuestions(i18n.language || 'en', 4, prev));
  };

  // Sync messages with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, messages, toolStatus, isEnlarged]);

  // Escape key closes enlarge or closes chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isEnlarged) {
          setIsEnlarged(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEnlarged]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleClearHistory = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    setMessages([]);
    setToolStatus(null);
    setErrorBanner(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setToolStatus(null);
    }
  };

  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isStreaming) return;

    setErrorBanner(null);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages([...newHistory, initialAssistantMsg]);
    setIsStreaming(true);
    setToolStatus(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getOrCreateSessionId(),
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          lang: i18n.language || 'en',
        }),
        signal: abortController.signal,
      });

      if (res.status === 403) {
        setErrorBanner(t('chat.region_blocked', 'The AI assistant is not available in your region.'));
        setIsStreaming(false);
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        return;
      }

      if (res.status === 429) {
        setErrorBanner(t('chat.rate_limited', 'The AI assistant is temporarily rate-limited. Please wait a moment.'));
        setIsStreaming(false);
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      if (!res.body) {
        throw new Error('ReadableStream not supported.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const rawJson = trimmedLine.slice(6);
            try {
              const event = JSON.parse(rawJson);

              if (event.type === 'status') {
                setToolStatus(event.message);
              } else if (event.type === 'delta') {
                setToolStatus(null);
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantMsgId) {
                    return { ...m, content: m.content + event.text };
                  }
                  return m;
                }));
              } else if (event.type === 'sources') {
                // Attach referenced sources to the message
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantMsgId) {
                    return { ...m, sources: event.sources };
                  }
                  return m;
                }));
              } else if (event.type === 'meta') {
                // Attach generation metrics to the message
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantMsgId) {
                    return {
                      ...m,
                      meta: {
                        model: event.model,
                        durationMs: event.durationMs,
                        ttftMs: event.ttftMs,
                        inputTokens: event.inputTokens,
                        thinkingTokens: event.thinkingTokens,
                        outputTokens: event.outputTokens,
                        totalTokens: event.totalTokens || event.tokenCount,
                        tokensPerSec: event.tokensPerSec,
                        costFormatted: event.costFormatted,
                      }
                    };
                  }
                  return m;
                }));
              } else if (event.type === 'done') {
                setToolStatus(null);
                setIsStreaming(false);
              } else if (event.type === 'error') {
                setErrorBanner(event.error);
                setIsStreaming(false);
                setToolStatus(null);
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // User aborted intentionally
      } else {
        console.error('[ChatWidget] Error during chat streaming:', err);
        setErrorBanner(t('chat.network_error', 'Failed to connect to the assistant service. Please check your connection.'));
      }
    } finally {
      setIsStreaming(false);
      setToolStatus(null);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label={t('chat.button_aria', 'Open AI portfolio assistant')}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-card hover:bg-accent text-card-foreground border border-border shadow-xl hover:shadow-2xl transition-all duration-200 group active:scale-95 cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
          </div>
          <span className="text-sm font-medium tracking-tight">
            {t('chat.button_label', 'Ask AI')}
          </span>
        </button>
      )}

      {/* Outside Click Backdrop when Enlarged: collapses back to docked side */}
      {isOpen && isEnlarged && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setIsEnlarged(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div 
          className={`fixed z-50 flex flex-col rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in ${
            isEnlarged
              ? 'inset-3 sm:inset-6 md:inset-10 lg:inset-12 max-w-5xl mx-auto my-auto h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-3rem)] md:h-[88vh]'
              : 'inset-x-3 bottom-3 top-16 sm:top-auto sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[620px] sm:max-h-[85vh] slide-in-from-bottom-5'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={t('chat.title', "Christian's AI Assistant")}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Bot className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div className="leading-tight">
                <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                  {t('chat.title', "Christian's AI Assistant")}
                </h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t('chat.subtitle', 'Grounded in portfolio code & metadata')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearHistory}
                  title={t('chat.clear_chat', 'Clear conversation')}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}

              {/* Enlarge / Collapse Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEnlarged(!isEnlarged)}
                title={isEnlarged ? t('chat.collapse', 'Collapse chat') : t('chat.enlarge', 'Enlarge chat')}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
              >
                {isEnlarged ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEnlarged(false);
                  setIsOpen(false);
                }}
                title={t('chat.close', 'Close chat')}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-card/50">
            {!consentGiven ? (
              <div className="flex flex-col items-center justify-center py-6 px-3 text-center max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {t('chat.consent_badge', 'Privacy & Security')}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-foreground pt-1.5">
                    {t('chat.consent_title', 'Data Privacy & Abuse Prevention')}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {t('chat.consent_intro', 'Before starting the conversation, please confirm that you agree to the processing of session data to protect this service against abuse:')}
                  </p>
                </div>

                <div className="w-full text-left space-y-2.5 bg-muted/60 rounded-xl p-3.5 border border-border/70 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Globe className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-card-foreground/90 leading-relaxed">{t('chat.consent_ip')}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-card-foreground/90 leading-relaxed">{t('chat.consent_messages')}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Cpu className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-card-foreground/90 leading-relaxed">{t('chat.consent_models')}</span>
                  </div>
                </div>

                <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    onClick={() => {
                      grantChatConsent();
                      setConsentGiven(true);
                    }}
                    className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-xl cursor-pointer hover:opacity-90 shadow-sm"
                  >
                    {t('chat.consent_accept', 'Accept & Start Chat')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                    }}
                    className="text-xs rounded-xl border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {t('chat.consent_decline', 'Decline')}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground select-none">
                  {t('chat.consent_cookie_note', 'A cookie will be saved for 180 days to remember your choice.')}
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-6 px-2 space-y-4 max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">
                    {t('chat.empty_greeting', "Hi, I'm Christian's AI Assistant!")}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                    {t('chat.empty_description', "I can answer questions about Christian's software engineering background, thesis work, and repository implementations.")}
                  </p>
                </div>

                <div className="w-full pt-2 text-left space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {t('chat.starters_heading', 'Suggested questions')}
                    </span>
                    <button
                      onClick={handleShuffleStarters}
                      className="flex items-center gap-1 text-[11px] text-primary hover:opacity-80 transition-opacity cursor-pointer font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {t('chat.shuffle_starters', 'More suggestions')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeStarters.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(q)}
                        className="text-left text-xs px-3.5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-card-foreground border border-border/60 hover:border-border transition-colors leading-snug cursor-pointer group flex items-start gap-2"
                      >
                        <span className="text-primary/70 group-hover:text-primary transition-colors mt-0.5">•</span>
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[95%] sm:max-w-[88%] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-xs font-normal text-xs sm:text-sm'
                          : 'bg-muted/60 text-card-foreground border border-border/60 rounded-tl-xs w-full'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <>
                          {msg.content ? (
                            <>
                              <MarkdownContent content={msg.content} />
                              {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                                <span className="inline-block w-1.5 h-3.5 bg-primary/80 align-middle ml-1 animate-pulse" />
                              )}
                            </>
                          ) : isStreaming ? (
                            <div className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                              <span className="font-semibold text-foreground">Thinking</span>
                              <span className="text-muted-foreground/40 font-mono">·</span>
                              <span className="text-primary truncate max-w-[240px] animate-pulse">
                                {toolStatus || t('chat.analyzing', 'Analyzing portfolio...')}
                              </span>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sources pill bar below assistant answer */}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pl-8 pt-0.5 text-xs">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 select-none">
                        <Bookmark className="w-3 h-3 text-primary" />
                        Sources:
                      </span>
                      {msg.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/80 hover:bg-muted text-card-foreground border border-border/70 hover:border-border text-[11px] font-mono transition-colors group cursor-pointer"
                          title={`Open ${src.title} in new tab`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="truncate max-w-[200px] text-foreground/90">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Generation Performance Metrics below assistant answer with Rich Hover Breakdown */}
                  {msg.role === 'assistant' && msg.meta && (
                    <div className="relative group/telemetry inline-flex items-center gap-1.5 pl-8 text-[11px] text-muted-foreground/75 select-none font-mono">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 text-[10px] font-sans text-foreground/80">
                        <Cpu className="w-2.5 h-2.5 text-primary" />
                        {msg.meta.model}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {(msg.meta.durationMs / 1000).toFixed(1)}s
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5 text-foreground/90 font-medium">
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        {msg.meta.tokensPerSec} tok/s
                      </span>
                      <span className="text-muted-foreground/60">({(msg.meta.totalTokens || 0).toLocaleString()} tokens)</span>

                      {/* Hover Tooltip Card showing TTFT, Input, Thinking, Output, Context & Cost */}
                      <div className="absolute bottom-full left-8 mb-1.5 hidden group-hover/telemetry:block z-50 p-2.5 rounded-xl bg-card text-card-foreground border border-border shadow-2xl text-[11px] font-sans w-56 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150">
                        <div className="font-semibold text-xs border-b border-border/60 pb-1.5 mb-1.5 flex items-center justify-between text-foreground">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            LLM Telemetry
                          </span>
                          <span className="text-[10px] text-emerald-500 font-mono font-medium">
                            {msg.meta.costFormatted || '$0.00'}
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-[10px]">
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>⏱️ TTFT:</span>
                            <span className="text-foreground font-semibold">{msg.meta.ttftMs ? `${msg.meta.ttftMs} ms` : '—'}</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>📥 Input tokens:</span>
                            <span className="text-foreground">{msg.meta.inputTokens?.toLocaleString() || '—'}</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>🧠 Thinking tokens:</span>
                            <span className="text-foreground">{msg.meta.thinkingTokens?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>📤 Output tokens:</span>
                            <span className="text-foreground">{msg.meta.outputTokens?.toLocaleString() || '—'}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-border/40 font-semibold text-foreground">
                            <span>📦 Context Size:</span>
                            <span>{(msg.meta.totalTokens || 0).toLocaleString()} tok</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>⚡ Throughput:</span>
                            <span className="text-amber-500 font-bold">{msg.meta.tokensPerSec} tok/s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Error Banner */}
            {errorBanner && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs leading-relaxed max-w-xl mx-auto">
                {errorBanner}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 sm:p-4 border-t border-border bg-card">
            <div className="max-w-4xl mx-auto w-full">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!consentGiven) return;
                  sendMessage(input);
                }}
                className="relative flex items-end gap-2"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  disabled={!consentGiven}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={
                    consentGiven
                      ? t('chat.placeholder', 'Ask about projects, architecture, code...')
                      : t('chat.consent_required', 'Consent is required to use the interactive AI assistant.')
                  }
                  className="flex-1 max-h-36 min-h-[44px] px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary resize-none leading-relaxed disabled:opacity-50"
                />

                {isStreaming ? (
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleStop}
                    title={t('chat.stop', 'Stop generating')}
                    className="h-[44px] w-[44px] rounded-xl shrink-0 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!consentGiven || !input.trim()}
                    title={t('chat.send', 'Send message')}
                    className="h-[44px] w-[44px] rounded-xl shrink-0 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </form>

              <p className="mt-1.5 text-[10px] text-center text-muted-foreground select-none">
                {t('chat.disclaimer', 'AI responses are grounded in repository code. Verify key details.')}
                {consentGiven && (
                  <button
                    type="button"
                    onClick={() => {
                      revokeChatConsent();
                      setConsentGiven(false);
                      setMessages([]);
                    }}
                    className="underline hover:text-foreground ml-1.5 transition-colors cursor-pointer"
                  >
                    {t('chat.consent_revoke', 'Reset consent')}
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
