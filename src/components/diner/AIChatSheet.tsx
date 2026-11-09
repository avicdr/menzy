'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, AlertCircle, Clock, Maximize2, Minimize2, ChevronRight } from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';

interface AIChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  sessionToken: string;
  focusedDish: any | null;
  onClearFocusedDish: () => void;
  onSelectDish: (dish: any) => void;
  publishedItems: any[];
}

interface Message {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  content: string;
  dishIds?: string[];
  safetyNotice?: string | null;
}

export function AIChatSheet({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  sessionToken,
  focusedDish,
  onClearFocusedDish,
  onSelectDish,
  publishedItems,
}: AIChatSheetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ASSISTANT',
      content: `Welcome to ${restaurantName}! I'm your digital host. Feel free to ask about ingredients, dietary suitability, protein counts, or pairing recommendations.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Rate Limiting & Cooldown State
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested chips
  const suggestedChips = focusedDish
    ? ['How much protein does it have?', 'What drink pairs with it?', 'What are the ingredients?', 'Is it spicy?']
    : ["What's popular here?", 'Show vegetarian options', 'Something under ₹300', 'Best coffee pairing'];

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Live countdown timer for rate limit cooldown
  useEffect(() => {
    if (cooldownSeconds == null || cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev == null || prev <= 1) {
          setRateLimitMessage(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading || cooldownSeconds != null) return;

    setInput('');
    const userMsgId = `usr_${Date.now()}`;
    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, sender: 'USER', content: textToSend },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/diner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          sessionToken,
          message: textToSend,
          selectedDishId: focusedDish?.id || null,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        // Rate limit reached
        setCooldownSeconds(data.retryAfterSeconds || 300);
        setRateLimitMessage(data.message || "You've reached the chat limit for now.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ASSISTANT',
          content: data.message,
          dishIds: data.dishIds,
          safetyNotice: data.safetyNotice,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ASSISTANT',
          content: 'Sorry, I had trouble processing that request. Please try again or ask our floor staff.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso-900/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div
        className={`relative w-full max-w-2xl bg-[var(--dishora-surface)] rounded-t-3xl shadow-sheet flex flex-col z-10 transition-all duration-300 ease-out ${
          isExpanded ? 'h-[95vh]' : 'h-[75vh]'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-cream-200 flex items-center justify-between bg-cream-50/50 rounded-t-3xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--dishora-accent)] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-[var(--dishora-text)]">
                {restaurantName} Host
              </h3>
              <p className="text-[11px] text-[var(--dishora-muted-text)]">
                Grounded Menu Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-full text-taupe-500 hover:bg-cream-200 transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-taupe-500 hover:bg-cream-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Focused Dish Context Banner */}
        {focusedDish && (
          <div className="px-5 py-2.5 bg-cream-100 border-b border-cream-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-espresso-800">
              <span className="font-semibold text-[var(--dishora-accent)]">Focused dish:</span>
              <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{focusedDish.customName}</span>
            </div>
            <button
              onClick={onClearFocusedDish}
              className="text-xs text-taupe-500 hover:text-espresso-800 underline"
            >
              Clear focus
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            const recommendedItems = msg.dishIds
              ? publishedItems.filter((i) => msg.dishIds?.includes(i.id))
              : [];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-[var(--dishora-accent)] text-white rounded-br-sm'
                      : 'bg-cream-100 text-[var(--dishora-text)] rounded-bl-sm border border-cream-200'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Allergen / Safety Notice Alert */}
                {msg.safetyNotice && (
                  <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[75%] p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{msg.safetyNotice}</span>
                  </div>
                )}

                {/* Recommended Dish Cards inside Chat */}
                {recommendedItems.length > 0 && (
                  <div className="w-full max-w-[90%] sm:max-w-[80%] grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {recommendedItems.map((item) => {
                      const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                      const price = item.priceMinor != null ? formatCurrencyMinor(item.priceMinor, item.currency) : '';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            onSelectDish(item);
                            onClose();
                          }}
                          className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-cream-200 hover:border-[var(--dishora-accent)] shadow-sm hover:shadow transition-all cursor-pointer group"
                        >
                          <img
                            src={img}
                            alt={item.customName}
                            className="w-14 h-14 rounded-lg object-cover bg-cream-50 shrink-0"
                          />
                          <div className="flex-1 min-w-0 pr-1">
                            <h4 className="font-semibold text-xs sm:text-sm text-espresso-800 truncate group-hover:text-[var(--dishora-accent)]">
                              {item.customName}
                            </h4>
                            <span className="text-xs font-bold text-espresso-900">{price}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-taupe-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-taupe-500 text-xs sm:text-sm italic">
              <Sparkles className="w-4 h-4 animate-spin text-[var(--dishora-accent)]" />
              Checking menu recipes & pairings...
            </div>
          )}
        </div>

        {/* Rate Limit Cooldown Warning Banner */}
        {cooldownSeconds != null && (
          <div className="mx-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-950 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{rateLimitMessage}</span>
            </div>
            <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              {formatTimer(cooldownSeconds)}
            </span>
          </div>
        )}

        {/* Suggested Question Chips */}
        {cooldownSeconds == null && (
          <div className="px-5 py-2 overflow-x-auto flex items-center gap-2 shrink-0 no-scrollbar">
            {suggestedChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-cream-100 text-espresso-700 hover:bg-cream-200 border border-cream-200 active:scale-95 transition-all shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Composer */}
        <div className="p-4 bg-white border-t border-cream-200 shrink-0 pb-safe">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={cooldownSeconds != null ? 'Chat paused for cooldown...' : 'Ask about dishes, ingredients, calories...'}
              disabled={loading || cooldownSeconds != null}
              className="flex-1 py-3 px-4 rounded-xl bg-cream-50 border border-cream-200 text-sm text-[var(--dishora-text)] placeholder:text-taupe-400 focus:outline-none focus:ring-2 focus:ring-[var(--dishora-accent)] focus:bg-white transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || cooldownSeconds != null}
              className="w-11 h-11 rounded-xl bg-[var(--dishora-accent)] text-white flex items-center justify-center hover:opacity-95 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
