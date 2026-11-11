'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

interface WalkthroughChapter {
  id: string;
  timeRange: string;
  startSec: number;
  endSec: number;
  title: string;
  description: string;
  badge: string;
  icon: 'menu' | 'dish' | 'ai' | 'cart';
}

const CLIP_DURATION_SECONDS = 13.33;

const WALKTHROUGH_CHAPTERS: WalkthroughChapter[] = [
  {
    id: 'browse',
    timeRange: '0:00 – 0:03',
    startSec: 0,
    endSec: 3,
    badge: 'Table QR Menu',
    title: 'Visual 3D-Styled Menu & Dietary Filters',
    description:
      'Guests scan Table 04 and filter cleanly by Veg, Non-Veg, Egg, or categories with crisp 3D dish visuals.',
    icon: 'menu',
  },
  {
    id: 'dish',
    timeRange: '0:03 – 0:06',
    startSec: 3,
    endSec: 6.2,
    badge: 'Dish Sheet',
    title: 'Tap a Plate, Add Notes & Add to Order',
    description:
      'Open Tandoori Paneer Tikka (₹380), enter optional kitchen notes, and tap Add to Order in one thumb reach.',
    icon: 'dish',
  },
  {
    id: 'ai',
    timeRange: '0:06 – 0:10',
    startSec: 6.2,
    endSec: 10,
    badge: 'AI Host',
    title: 'Grounded Pairing Answers in Seconds',
    description:
      'Ask "What drink pairs with it?" and get grounded pairing picks like Kadak Masala Chai (₹160) with one-tap add.',
    icon: 'ai',
  },
  {
    id: 'cart',
    timeRange: '0:10 – 0:13',
    startSec: 10,
    endSec: CLIP_DURATION_SECONDS,
    badge: 'Table Cart',
    title: 'Live Subtotal, Taxes & Direct KDS Ticket',
    description:
      'Review itemized dishes, 5% taxes (₹567 total), and send directly to the kitchen display with zero app download.',
    icon: 'cart',
  },
];

function formatSeconds(sec: number): string {
  const safe = Math.max(0, Math.min(Math.round(sec), Math.round(CLIP_DURATION_SECONDS)));
  return `0:${String(safe).padStart(2, '0')}`;
}

function renderChapterIcon(kind: WalkthroughChapter['icon']) {
  switch (kind) {
    case 'menu':
      return <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />;
    case 'dish':
      return <Sparkles className="w-4 h-4" aria-hidden="true" />;
    case 'ai':
      return <Bot className="w-4 h-4" aria-hidden="true" />;
    case 'cart':
      return <ShoppingBag className="w-4 h-4" aria-hidden="true" />;
  }
}

export function MenuPreviewClip() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(CLIP_DURATION_SECONDS);
  const [hasMediaError, setHasMediaError] = useState(false);

  // Detect reduced-motion preference without blocking SSR
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (matches: boolean) => {
      setPrefersReducedMotion(matches);
      if (matches && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };

    handleMotionChange(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => handleMotionChange(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  // Observe near-viewport (for metadata preload) and visible intersection (for play/pause)
  useEffect(() => {
    const target = containerRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      setIsInViewport(true);
      return;
    }

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          preloadObserver.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    const playObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsInViewport(entry.isIntersecting && entry.intersectionRatio >= 0.25);
        }
      },
      { threshold: [0, 0.25, 0.5] }
    );

    preloadObserver.observe(target);
    playObserver.observe(target);

    return () => {
      preloadObserver.disconnect();
      playObserver.disconnect();
    };
  }, []);

  // Sync playback to visibility, user intent, and reduced-motion preference
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasMediaError) return;

    if (isInViewport && !prefersReducedMotion && !userPaused) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    } else if (!video.paused) {
      video.pause();
    }
  }, [isInViewport, prefersReducedMotion, userPaused, hasMediaError]);

  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasMediaError) return;

    if (video.paused) {
      setUserPaused(false);
      setIsNearViewport(true);
      video.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      setUserPaused(true);
      video.pause();
    }
  }, [hasMediaError]);

  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasMediaError) return;
    setUserPaused(false);
    setIsNearViewport(true);
    video.currentTime = 0;
    setCurrentTime(0);
    video.play().catch(() => {
      setIsPlaying(false);
    });
  }, [hasMediaError]);

  const handleJumpToChapter = useCallback(
    (startSec: number) => {
      const video = videoRef.current;
      if (!video || hasMediaError) return;
      setUserPaused(false);
      setIsNearViewport(true);
      video.currentTime = startSec;
      setCurrentTime(startSec);
      video.play().catch(() => {
        setIsPlaying(false);
      });
    },
    [hasMediaError]
  );

  const activeChapter =
    WALKTHROUGH_CHAPTERS.find(
      (chapter) => currentTime >= chapter.startSec && currentTime < chapter.endSec
    ) ?? WALKTHROUGH_CHAPTERS[0];

  const effectiveDuration = duration > 0 ? duration : CLIP_DURATION_SECONDS;
  const progressRatio = Math.max(0, Math.min(1, currentTime / effectiveDuration));

  const videoLazyProps = { loading: 'lazy' } as Record<string, string>;

  return (
    <figure
      ref={containerRef}
      style={{ contain: 'layout style paint' }}
      className="mt-6 max-w-5xl mx-auto p-4 sm:p-7 bg-white rounded-3xl border border-cream-300 shadow-lifted text-left"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left: Recorded 9:16 Mobile Menu Clip inside Phone Frame */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[300px] sm:max-w-[320px] rounded-[2.2rem] p-2.5 bg-espresso-900 shadow-2xl border border-espresso-800">
            {/* Subtle speaker notch */}
            <div className="flex items-center justify-between px-4 pb-2 pt-0.5 text-[10px] font-medium text-cream-300">
              <span>menzy.app/m/saffron</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                    isPlaying ? 'motion-safe:animate-pulse' : ''
                  }`}
                  aria-hidden="true"
                />
                {isPlaying ? 'Playing clip' : 'Preview paused'}
              </span>
            </div>

            <div className="relative aspect-[9/16] w-full rounded-[1.6rem] overflow-hidden bg-cream-100 border border-white/10">
              {hasMediaError ? (
                <img
                  src="/media/menu-preview-poster.webp"
                  alt="Preview frame of Saffron Courtyard Café mobile menu showing filter pills and Classic Cappuccino"
                  width={540}
                  height={960}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  {...videoLazyProps}
                  width={540}
                  height={960}
                  poster="/media/menu-preview-poster.webp"
                  preload={isNearViewport ? 'metadata' : 'none'}
                  muted
                  playsInline
                  loop
                  aria-label="13-second preview clip of the Menzy mobile QR menu, dish customization sheet, AI host recommendations, and table cart"
                  onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (Number.isFinite(d) && d > 0) setDuration(d);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onError={() => setHasMediaError(true)}
                  className="w-full h-full object-cover block"
                >
                  <source src="/media/menu-preview.webm" type="video/webm" />
                  <source src="/media/menu-preview.mp4" type="video/mp4" />
                  Your browser does not support embedded preview video. Open the interactive demo menu
                  directly.
                </video>
              )}
            </div>
          </div>

          {/* Accessible Playback Controls & Compositor Progress Bar */}
          <div className="w-full max-w-[300px] sm:max-w-[320px] mt-3.5 space-y-2">
            <div
              className="h-1.5 w-full rounded-full bg-cream-200 overflow-hidden"
              aria-hidden="true"
            >
              <div
                className="h-full w-full bg-terracotta origin-left motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-linear"
                style={{ transform: `scaleX(${progressRatio})` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  disabled={hasMediaError}
                  aria-label={isPlaying ? 'Pause menu preview clip' : 'Play menu preview clip'}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso-900"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReplay}
                  disabled={hasMediaError}
                  aria-label="Replay menu preview clip from start"
                  className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-xl bg-cream-100 border border-cream-300 text-espresso-900 hover:bg-cream-200 disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <span className="text-xs font-mono text-taupe-600 menzy-tabular">
                {formatSeconds(currentTime)} / {formatSeconds(effectiveDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Synced Walkthrough Chapters (also serves as WCAG 1.2.1 text walkthrough) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-200">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-terracotta-50 border border-terracotta-200/80 text-[11px] font-semibold uppercase tracking-wider text-terracotta-700">
                13-Second Live Flow Clip
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 mt-1.5">
                Browse, Ask AI &amp; Order from Table 04
              </h3>
            </div>
            <span className="text-xs font-medium text-taupe-600 bg-cream-100 px-3 py-1 rounded-full border border-cream-200">
              No app download required
            </span>
          </div>

          <figcaption className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
            Real mobile walkthrough of a Menzy digital menu: guests filter 3D-styled dishes by dietary preference, customize plates, ask the grounded AI host for pairings, and send orders directly to your kitchen. Click any step below to jump in the clip.
          </figcaption>

          <ol className="space-y-2.5">
            {WALKTHROUGH_CHAPTERS.map((chapter) => {
              const isActive = activeChapter.id === chapter.id;
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => handleJumpToChapter(chapter.startSec)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso-900 ${
                      isActive
                        ? 'bg-cream-50 border-terracotta shadow-sm'
                        : 'bg-white border-cream-200 hover:bg-cream-50 hover:border-cream-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                          isActive
                            ? 'bg-terracotta text-white border-terracotta'
                            : 'bg-cream-100 text-espresso-800 border-cream-200'
                        }`}
                      >
                        {renderChapterIcon(chapter.icon)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-espresso-900">
                            {chapter.title}
                          </span>
                          <span className="text-[11px] font-mono text-taupe-600 menzy-tabular shrink-0">
                            {chapter.timeRange}
                          </span>
                        </div>
                        <p className="text-xs text-taupe-600 leading-relaxed mt-1">
                          {chapter.description}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/m/chai-and-chutney"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso-900"
            >
              <span>Try the Interactive Menu Yourself</span>
              <ExternalLink className="w-3.5 h-3.5 text-terracotta-200 shrink-0" aria-hidden="true" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-cream-100 border border-cream-300 text-espresso-900 text-xs sm:text-sm font-semibold hover:bg-cream-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso-900"
            >
              <span>Create Your Menu Free</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </figure>
  );
}
