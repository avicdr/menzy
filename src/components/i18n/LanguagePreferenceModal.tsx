'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Check, Sparkles, X, Languages } from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import {
  useManagementLanguage,
  ManagementLang,
} from '@/lib/i18n/management-i18n';

export interface LanguagePreferenceModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
  onConfirm?: (selectedLang: ManagementLang) => void;
}

export function LanguagePreferenceModal({
  forceOpen = false,
  onClose,
  onConfirm,
}: LanguagePreferenceModalProps) {
  const { lang, setChosenLang, hasChosenLang, isLoaded } = useManagementLanguage();
  const [selected, setSelected] = useState<ManagementLang>(lang);

  // Sync selected with current active lang when modal opens
  useEffect(() => {
    setSelected(lang);
  }, [lang]);

  // Only show when loaded and user has not chosen yet, or when explicitly forced open
  const shouldShow = forceOpen || (!hasChosenLang && isLoaded);

  if (!shouldShow) {
    return null;
  }

  const handleConfirm = () => {
    setChosenLang(selected);
    onConfirm?.(selected);
    onClose?.();
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-espresso-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lang-modal-title"
      >
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden font-sans p-6 sm:p-8 text-espresso-900 transition-all">
          {/* Optional close button if force opened manually */}
          {forceOpen && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-taupe-400 hover:text-espresso-800 hover:bg-cream-100 rounded-full transition-colors"
              aria-label="Close language selector"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta border border-terracotta-200/80 flex items-center justify-center shadow-sm shrink-0">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-terracotta-100/60 text-terracotta-800 mb-1.5">
                <Sparkles className="w-3 h-3 text-terracotta" />
                <span>{selected === 'hi' ? 'मेंज़ी में आपका स्वागत है' : 'Welcome to Menzy'}</span>
              </div>
              <h2 id="lang-modal-title" className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 tracking-tight leading-snug">
                {selected === 'hi' ? 'अपनी पसंदीदा भाषा चुनें' : 'Choose your preferred language'}
              </h2>
              <p className="text-xs sm:text-sm text-taupe-600 mt-1 leading-relaxed">
                {selected === 'hi'
                  ? 'रेस्तरां और किचन प्रबंधन के लिए अपनी पसंदीदा भाषा चुनें।'
                  : 'Select your preferred language for kitchen ticketing, order fulfillment, and management console.'}
              </p>
            </div>
          </div>

          {/* Language Selection Cards */}
          <div className="space-y-3" role="radiogroup" aria-label="Language options">
            {/* English Card */}
            <button
              type="button"
              role="radio"
              aria-checked={selected === 'en'}
              onClick={() => setSelected('en')}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                selected === 'en'
                  ? 'border-terracotta bg-terracotta-50/40 ring-2 ring-terracotta/20 shadow-sm'
                  : 'border-cream-200 bg-white hover:border-cream-300 hover:bg-cream-50/50'
              }`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  selected === 'en'
                    ? 'border-terracotta bg-terracotta text-white'
                    : 'border-taupe-300 bg-white'
                }`}
              >
                {selected === 'en' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-espresso-900">
                      English
                    </span>
                    <span className="text-[11px] font-mono font-medium text-taupe-500 bg-cream-100 px-1.5 py-0.5 rounded">
                      EN
                    </span>
                  </div>
                  {selected === 'en' && (
                    <span className="text-[10px] font-semibold text-terracotta bg-terracotta-100/70 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-taupe-600 mt-1">
                  Clean, modern English interface for management and kitchen operations
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-medium text-espresso-700 bg-white/90 border border-cream-200/90 rounded-md px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Kitchen Prep • Ready to Serve</span>
                </div>
              </div>
            </button>

            {/* Hindi Card */}
            <button
              type="button"
              role="radio"
              aria-checked={selected === 'hi'}
              onClick={() => setSelected('hi')}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                selected === 'hi'
                  ? 'border-terracotta bg-terracotta-50/40 ring-2 ring-terracotta/20 shadow-sm'
                  : 'border-cream-200 bg-white hover:border-cream-300 hover:bg-cream-50/50'
              }`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  selected === 'hi'
                    ? 'border-terracotta bg-terracotta text-white'
                    : 'border-taupe-300 bg-white'
                }`}
              >
                {selected === 'hi' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-espresso-900">
                      हिन्दी
                    </span>
                    <span className="text-xs text-taupe-500">(Hindi)</span>
                    <span className="text-[11px] font-mono font-medium text-taupe-500 bg-cream-100 px-1.5 py-0.5 rounded">
                      HI
                    </span>
                  </div>
                  {selected === 'hi' && (
                    <span className="text-[10px] font-semibold text-terracotta bg-terracotta-100/70 px-2 py-0.5 rounded-full">
                      चयनित
                    </span>
                  )}
                </div>
                <p className="text-xs text-taupe-600 mt-1">
                  किचन डिस्प्ले, लाइव ऑर्डर्स और सभी सेटिंग्स हिंदी में प्रबंधित करें
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-medium text-espresso-700 bg-white/90 border border-cream-200/90 rounded-md px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>किचन तैयारी • परोसने के लिए तैयार</span>
                </div>
              </div>
            </button>
          </div>

          {/* Reassurance note */}
          <div className="mt-5 p-3 rounded-xl bg-cream-50 border border-cream-200 flex items-center gap-2.5 text-xs text-taupe-600">
            <Globe className="w-4 h-4 text-terracotta shrink-0" />
            <span>
              {selected === 'hi'
                ? '💡 आप किसी भी समय शीर्ष नेविगेशन बार या सेटिंग्स से भाषा बदल सकते हैं।'
                : '💡 You can switch language anytime from the top bar or settings.'}
            </span>
          </div>

          {/* Action Footer */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 px-5 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white font-semibold text-sm transition-all shadow-md shadow-terracotta/20 flex items-center justify-center gap-2"
            >
              <span>
                {selected === 'hi' ? 'कंसोल पर आगे बढ़ें' : 'Continue to Console'}
              </span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
