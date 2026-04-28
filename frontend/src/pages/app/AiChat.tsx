import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Film, Music, Loader2, Trash2, ChevronDown, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

const GEMINI_API_KEY = 'AIzaSyBmtvjkwNgOEw7m_ze95oUDx8wpkh8Jz9c';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are CineTune AI, an expert entertainment companion integrated into a personal media server. You specialize in:
- Movies: recommendations, plot analysis, director/actor info, cinematography, genre deep dives, hidden gems, awards history
- Songs & Music: recommendations, lyrics meaning, artist biographies, music theory, genre history, album breakdowns, playlists
- TV Shows: episode guides, character analysis, season breakdowns, comparisons
- Entertainment news and upcoming releases

Be conversational, enthusiastic, and knowledgeable. Format your responses with markdown when helpful (use **bold**, *italic*, bullet points). Keep responses concise but comprehensive. If someone asks about something outside entertainment/media, gently redirect them to movies, music, or TV shows.`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type Topic = 'all' | 'movies' | 'music';

const TOPIC_STARTERS: Record<Topic, string[]> = {
  all: [
    '🎬 Recommend me a hidden gem movie',
    '🎵 What are the best albums of this decade?',
    '📺 Best binge-worthy TV shows right now',
    '🎭 What makes a great film score?',
  ],
  movies: [
    '🎬 Best sci-fi films of all time?',
    '🎭 Recommend a psychological thriller',
    '🏆 Which movie deserved to win the Oscar?',
    '🎥 Explain the ending of Inception',
  ],
  music: [
    '🎵 Recommend songs similar to Bohemian Rhapsody',
    '🎸 Best rock albums ever made?',
    '🎤 Who are the most influential artists of the 2010s?',
    '🎹 Explain jazz music theory simply',
  ],
};

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-white/10 rounded px-1 py-0.5 text-sm font-mono text-apple-blue">$1</code>')
    .replace(/^### (.*)/gm, '<h3 class="text-sm font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.*)/gm, '<h2 class="text-base font-bold text-white mt-3 mb-1">$1</h2>')
    .replace(/^• (.*)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
    .replace(/^- (.*)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
    .replace(/^\d+\. (.*)/gm, '<li class="ml-4 list-decimal text-gray-300">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

function getUserName(): string {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.name?.split(' ')[0] || '';
    }
  } catch { /* ignore */ }
  return '';
}

function buildWelcome(): string {
  const name = getUserName();
  const greeting = name ? `Hey **${name}**! 🎬🎵` : 'Hey there! 🎬🎵';
  return `${greeting} — your personal entertainment guide is ready. Ask me anything about movies, music, TV shows, artists, or directors. What are you in the mood for today?`;
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: buildWelcome(),
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState<Topic>('all');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShowScrollBtn(!isNearBottom);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const buildHistory = (msgs: Message[]) => {
    return msgs.slice(1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = buildHistory([...messages, userMessage]);

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: history,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API error');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      }]);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Something went wrong: ${errMsg}. Please try again.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: buildWelcome(),
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="h-full flex flex-col bg-black">

      {/* ── Page Header (matches Discover/Watchlist style) ── */}
      <div className="px-4 md:px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-apple-blue shadow-lg">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">AI Chat</h1>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-apple-blue/15 text-apple-blue rounded-full border border-apple-blue/20">Gemini 2.5</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {getUserName() ? `Welcome back, ${getUserName()}` : 'Ask about movies, music & TV shows'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Topic tabs */}
            <div className="flex items-center gap-1 bg-gray-800/60 rounded-xl p-1">
              {([
                { key: 'all',    label: 'All',    icon: Sparkles },
                { key: 'movies', label: 'Movies', icon: Film    },
                { key: 'music',  label: 'Music',  icon: Music   },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTopic(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    topic === key
                      ? 'bg-apple-blue text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={clearChat}
              title="Clear chat"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all duration-200"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-5 relative"
        style={{ scrollbarWidth: 'none' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {/* AI avatar */}
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center shrink-0 mt-1 text-apple-blue">
                  <Bot size={15} />
                </div>
              )}

              <div className={cn(
                'max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-apple-blue text-white rounded-tr-sm'
                  : 'bg-gray-800/70 border border-white/8 text-gray-100 rounded-tl-sm'
              )}>
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
                <p className={cn(
                  'text-[10px] mt-2 leading-none',
                  message.role === 'user' ? 'text-white/50 text-right' : 'text-gray-600'
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* User avatar */}
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center shrink-0 mt-1 text-gray-400">
                  <User size={15} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center shrink-0 text-apple-blue">
              <Bot size={15} />
            </div>
            <div className="bg-gray-800/70 border border-white/8 rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-apple-blue rounded-full"
                    animate={{ y: ['0%', '-60%', '0%'] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-32 right-8 z-20 w-9 h-9 bg-apple-blue hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <ChevronDown size={16} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Starter prompts (only when fresh) ── */}
      {messages.length <= 1 && (
        <div className="px-4 md:px-8 pb-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOPIC_STARTERS[topic].map((starter, i) => (
              <motion.button
                key={starter}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => sendMessage(starter.replace(/^[^\s]+\s/, ''))}
                className="text-left px-4 py-3 bg-gray-800/60 hover:bg-gray-800 border border-white/8 hover:border-apple-blue/40 rounded-2xl text-sm text-gray-300 hover:text-white transition-all duration-200"
              >
                {starter}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="px-4 md:px-8 pb-8 pt-3 shrink-0 border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about movies, music, artists, shows..."
              rows={1}
              disabled={isLoading}
              className="w-full bg-gray-800/60 border border-white/10 hover:border-white/20 focus:border-apple-blue/60 rounded-2xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-apple-blue/30 resize-none transition-all duration-200 disabled:opacity-50 leading-relaxed"
              style={{ maxHeight: '120px' }}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200',
              input.trim() && !isLoading
                ? 'bg-apple-blue hover:bg-blue-600 text-white shadow-lg shadow-apple-blue/20'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            )}
          >
            {isLoading
              ? <Loader2 size={18} className="animate-spin" />
              : <Send size={16} />
            }
          </motion.button>
        </form>
        <p className="hidden md:block text-center text-[11px] text-gray-600 mt-2.5">
          Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-500 text-[10px]">Enter</kbd> to send ·{' '}
          <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-500 text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
