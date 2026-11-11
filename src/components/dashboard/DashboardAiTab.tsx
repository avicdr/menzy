'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bot, CheckCircle2, RefreshCw, Save, Send, Sparkles } from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';

interface DashboardAiTabProps {
  restaurant: any;
  rawInitialSettings: any;
  onAiSettingsSaved?: (nextSettings: {
    welcomeMessage: string;
    aiTone: string;
    allowDinerChat: boolean;
    allowPairings: boolean;
    maxDinerChatPerSession: number;
  }) => void;
  menuItems: any[];
  onSubscriptionExpired: (payload?: any) => void;
}

const DEFAULT_WELCOME = 'Welcome! Explore our dishes or ask our AI waiter anything.';
const DEFAULT_TONE = 'Warm Editorial & Helpful';

export function DashboardAiTab({
  restaurant,
  rawInitialSettings,
  onAiSettingsSaved,
  menuItems,
  onSubscriptionExpired,
}: DashboardAiTabProps) {
  const [welcomeMsg, setWelcomeMsg] = useState(
    () => rawInitialSettings?.welcomeMessage || DEFAULT_WELCOME
  );
  const [aiTone, setAiTone] = useState(() => rawInitialSettings?.aiTone || DEFAULT_TONE);
  const [allowDinerChat, setAllowDinerChat] = useState(
    () => rawInitialSettings?.allowDinerChat ?? true
  );
  const [allowPairings, setAllowPairings] = useState(
    () => rawInitialSettings?.allowPairings ?? true
  );
  const [maxDinerChat, setMaxDinerChat] = useState(
    () => rawInitialSettings?.maxDinerChatPerSession ?? 25
  );
  const [aiSavedToast, setAiSavedToast] = useState(false);
  const [aiTestPrompt, setAiTestPrompt] = useState('');
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiTestResponse, setAiTestResponse] = useState<any>(null);

  const syncedRef = useRef<any>(rawInitialSettings);
  const hasLocalEditsRef = useRef(false);

  useEffect(() => {
    if (rawInitialSettings && rawInitialSettings !== syncedRef.current && !hasLocalEditsRef.current) {
      syncedRef.current = rawInitialSettings;
      setWelcomeMsg(rawInitialSettings.welcomeMessage || DEFAULT_WELCOME);
      setAiTone(rawInitialSettings.aiTone || DEFAULT_TONE);
      setAllowDinerChat(rawInitialSettings.allowDinerChat ?? true);
      setAllowPairings(rawInitialSettings.allowPairings ?? true);
      setMaxDinerChat(rawInitialSettings.maxDinerChatPerSession ?? 25);
    }
  }, [rawInitialSettings]);

  const handleSaveAISettings = async () => {
    const res = await fetch('/api/restaurant/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        welcomeMessage: welcomeMsg,
        aiTone,
        allowDinerChat,
        allowPairings,
        maxDinerChatPerSession: maxDinerChat,
      }),
    });

    if (res.status === 402) {
      const payload = await res.json().catch(() => ({}));
      onSubscriptionExpired(payload);
      return;
    }

    if (res.ok) {
      const saved = {
        welcomeMessage: welcomeMsg,
        aiTone,
        allowDinerChat,
        allowPairings,
        maxDinerChatPerSession: maxDinerChat,
      };
      syncedRef.current = saved;
      hasLocalEditsRef.current = false;
      onAiSettingsSaved?.(saved);
      setAiSavedToast(true);
      setTimeout(() => setAiSavedToast(false), 3000);
    } else {
      alert('Failed to save AI Waiter settings');
    }
  };

  const handleTestAiQuery = async (queryText?: string) => {
    const text = queryText || aiTestPrompt;
    if (!text.trim()) return;

    setAiTestLoading(true);
    setAiTestResponse(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/diner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          restaurantId: restaurant.id,
          sessionToken: 'owner-test-session',
          message: text.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        onSubscriptionExpired(data);
        return;
      }
      if (res.ok) {
        setAiTestResponse(data);
      } else {
        alert(data.error || data.message || 'AI query failed');
      }
    } catch (err: any) {
      alert(
        err?.name === 'AbortError'
          ? 'AI query timed out after 15 seconds. Please try again.'
          : 'Error querying AI'
      );
    } finally {
      clearTimeout(timeoutId);
      setAiTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-espresso-900">AI Waiter Studio</h2>
          <p className="text-xs sm:text-sm text-taupe-500 mt-1">
            Configure your grounded AI conversational assistant, set tone and greetings, and test diner questions live.
          </p>
        </div>

        <button
          onClick={handleSaveAISettings}
          className="px-4 py-2 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-2"
        >
          <Save className="w-4 h-4 text-terracotta" /> Save AI Waiter
        </button>
      </div>

      {aiSavedToast && (
        <div className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-sage-600" />
          AI Waiter personality settings saved and synced!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
            <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
              AI Waiter Persona &amp; Tone
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: 'Warm Editorial & Helpful',
                  desc: 'Warm hospitality, concise descriptions, culinary elegance',
                },
                {
                  key: 'Fine Dining Sommelier',
                  desc: 'Sophisticated wine/pairing knowledge, detailed tasting notes',
                },
                {
                  key: 'Modern Casual & Swift',
                  desc: 'Direct, friendly, rapid answers for fast-paced dining',
                },
                {
                  key: 'Playful Bistro Guide',
                  desc: 'Enthusiastic food lover, colorful dish recommendations',
                },
              ].map((tone) => (
                <button
                  key={tone.key}
                  type="button"
                  onClick={() => {
                    hasLocalEditsRef.current = true;
                    setAiTone(tone.key);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    aiTone === tone.key
                      ? 'border-terracotta ring-2 ring-terracotta/20 bg-cream-50'
                      : 'border-cream-200 hover:border-cream-300 bg-white'
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm text-espresso-900 mb-1">
                    {tone.key}
                  </div>
                  <p className="text-[11px] text-taupe-500 leading-relaxed">{tone.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-2">
            <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
              Diner Welcome Greeting
            </label>
            <p className="text-xs text-taupe-500">
              The initial greeting displayed when a diner scans the QR code and opens the AI concierge.
            </p>
            <textarea
              rows={3}
              value={welcomeMsg}
              onChange={(e) => {
                hasLocalEditsRef.current = true;
                setWelcomeMsg(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
            <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
              Capabilities &amp; Limits
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDinerChat}
                  onChange={(e) => {
                    hasLocalEditsRef.current = true;
                    setAllowDinerChat(e.target.checked);
                  }}
                  className="rounded border-cream-300 text-terracotta focus:ring-terracotta w-4 h-4"
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-espresso-900 block">
                    Allow Diner Conversational Inquiries
                  </span>
                  <span className="text-[11px] text-taupe-500 block">
                    Diners can ask about spices, cooking methods, and dietary safety
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPairings}
                  onChange={(e) => {
                    hasLocalEditsRef.current = true;
                    setAllowPairings(e.target.checked);
                  }}
                  className="rounded border-cream-300 text-terracotta focus:ring-terracotta w-4 h-4"
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-espresso-900 block">
                    Suggest Food &amp; Beverage Pairings
                  </span>
                  <span className="text-[11px] text-taupe-500 block">
                    AI pairs mains with drinks and desserts from your actual menu
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-terracotta" />
              <h3 className="font-serif text-lg font-bold text-espresso-900">
                Live AI Waiter Tester
              </h3>
            </div>
            <p className="text-xs text-taupe-500">
              Test your restaurant&apos;s grounded AI assistant using your real menu items and recipes.
            </p>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-taupe-500 uppercase">
                Sample Inquiries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What do you recommend for dinner?',
                  'Which dishes are Pure Veg?',
                  'Are there gluten-free dishes?',
                  'What beverage pairs best?',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setAiTestPrompt(sample);
                      handleTestAiQuery(sample);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium bg-cream-100 hover:bg-cream-200 text-espresso-800 rounded-full transition-colors border border-cream-200"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiTestPrompt}
                onChange={(e) => setAiTestPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestAiQuery()}
                placeholder="Ask your AI waiter anything..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
              <button
                type="button"
                onClick={() => handleTestAiQuery()}
                disabled={aiTestLoading}
                className="px-4 py-2 bg-espresso-900 text-white rounded-xl hover:bg-espresso-800 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
              >
                {aiTestLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-terracotta" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {aiTestResponse && (
              <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-terracotta uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Waiter Response
                  </span>
                  <span className="text-[10px] text-taupe-400">Grounded in Menu</span>
                </div>
                <p className="text-xs sm:text-sm text-espresso-900 leading-relaxed whitespace-pre-wrap">
                  {aiTestResponse.message || aiTestResponse.answer}
                </p>
                {(aiTestResponse.dishIds || aiTestResponse.recommendedDishIds)?.length > 0 && (
                  <div className="pt-2 border-t border-cream-200">
                    <span className="text-[10px] font-semibold text-taupe-500 uppercase block mb-1.5">
                      Recommended Dishes Attached
                    </span>
                    <div className="space-y-1.5">
                      {(aiTestResponse.dishIds || aiTestResponse.recommendedDishIds).map(
                        (dishId: string) => {
                          const dish = menuItems.find((m) => m.id === dishId);
                          if (!dish) return null;
                          return (
                            <div
                              key={dishId}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-cream-200"
                            >
                              <img
                                src={
                                  dish.imageOverride?.publicUrl ||
                                  dish.canonical?.imageAsset?.publicUrl ||
                                  '/placeholder-dish.svg'
                                }
                                alt=""
                                className="w-8 h-8 rounded-md object-cover bg-cream-100"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-xs text-espresso-900 truncate block">
                                  {dish.customName}
                                </span>
                                <span className="text-[10px] text-terracotta font-bold">
                                  {formatCurrencyMinor(dish.priceMinor || 0, dish.currency)}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

