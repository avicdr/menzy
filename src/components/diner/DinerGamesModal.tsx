'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  X,
  Trophy,
  RotateCcw,
  Sparkles,
  Users,
  Flame,
  CheckCircle2,
  HelpCircle,
  Zap,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';

interface DinerGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
}

type GameType = 'MENU' | 'ROULETTE' | 'TRIVIA' | 'TRUTH_OR_DARE' | 'REACTION';

const TRIVIA_QUESTIONS = [
  {
    q: 'Which country drinks the most coffee per capita in the world?',
    options: ['Italy', 'Finland', 'Brazil', 'United States'],
    answer: 1,
    fact: 'Finns consume an astonishing 12 kg (26 lbs) of coffee per person every year!',
  },
  {
    q: 'Which spice is derived from Crocus sativus and is the world’s most expensive spice?',
    options: ['Cardamom', 'Vanilla', 'Saffron', 'Cinnamon'],
    answer: 2,
    fact: 'It takes roughly 75,000 saffron blossoms to yield just one single pound of saffron threads.',
  },
  {
    q: 'In Italian cooking, what does "al dente" literally mean?',
    options: ['To the tooth', 'Cooked softly', 'With sauce', 'Firmly shaped'],
    answer: 0,
    fact: '"Al dente" translates to "to the tooth", describing pasta with a firm, satisfying bite.',
  },
  {
    q: 'What is the primary base ingredient in traditional hummus?',
    options: ['Lentils', 'Chickpeas', 'White beans', 'Cashews'],
    answer: 1,
    fact: 'Hummus is made from cooked mashed chickpeas blended with tahini, lemon juice, and garlic.',
  },
  {
    q: 'What gives sourdough bread its distinctive tart and complex flavor?',
    options: ['Baking soda', 'Lactic acid bacteria', 'White vinegar', 'Citric powder'],
    answer: 1,
    fact: 'Wild lactic acid bacteria ferment alongside wild yeasts in the starter to produce tangy acids.',
  },
  {
    q: 'What is the Japanese culinary term for the savory "fifth taste"?',
    options: ['Kokumi', 'Umami', 'Dashi', 'Sashimi'],
    answer: 1,
    fact: 'Discovered in 1908 by chemist Kikunae Ikeda, umami translates to "pleasant savory taste".',
  },
  {
    q: 'Which fruit is the authentic flavor base of traditional grenadine syrup?',
    options: ['Cherry', 'Pomegranate', 'Raspberry', 'Blackcurrant'],
    answer: 1,
    fact: 'Grenade is the French word for pomegranate, the historical fruit used for genuine grenadine.',
  },
  {
    q: 'Which country is the cultural birthplace of the aromatic rendang curry?',
    options: ['Indonesia', 'Thailand', 'Malaysia', 'Vietnam'],
    answer: 0,
    fact: 'Rendang originated with the Minangkabau ethnic group in West Sumatra, Indonesia.',
  },
];

const TRUTH_DARES = [
  {
    type: 'TRUTH',
    text: 'What is the most bizarre or embarrassing food combination that you secretly love?',
  },
  {
    type: 'DARE',
    text: 'Let the person to your left take the very first sip or bite of whatever you order today.',
  },
  {
    type: 'TRUTH',
    text: 'Have you ever sent a dish or drink back at a restaurant? What happened?',
  },
  {
    type: 'DARE',
    text: 'Deliver a 10-second dramatic critique of a glass of table water like a 3-star Michelin chef.',
  },
  {
    type: 'TRUTH',
    text: 'If you could only eat at one restaurant cuisine for the rest of your life, what is it?',
  },
  {
    type: 'DARE',
    text: 'Speak in a royal accent whenever you talk to our waiter or order items for the next 5 minutes.',
  },
  {
    type: 'TRUTH',
    text: 'What is your absolute biggest dining pet peeve when eating out in a group?',
  },
  {
    type: 'DARE',
    text: 'Ask our AI menu assistant the weirdest food question you can think of and read its reply out loud.',
  },
];

export function DinerGamesModal({ isOpen, onClose, restaurantName }: DinerGamesModalProps) {
  const [activeGame, setActiveGame] = useState<GameType>('MENU');
  const [playerCount, setPlayerCount] = useState<number>(3);

  // 1. Bill Roulette State
  const [rouletteState, setRouletteState] = useState<'idle' | 'spinning' | 'chosen'>('idle');
  const [chosenPlayer, setChosenPlayer] = useState<number | null>(null);

  // 2. Trivia State
  const [triviaRound, setTriviaRound] = useState(0);
  const [triviaScores, setTriviaScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const [triviaTurn, setTriviaTurn] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // 3. Truth or Dare State
  const [tdCurrentIndex, setTdCurrentIndex] = useState(0);
  const [tdActivePlayer, setTdActivePlayer] = useState(0);

  // 4. Reaction Game State
  const [reactionStage, setReactionStage] = useState<'waiting' | 'ready' | 'tapped'>('waiting');
  const [reactionWinner, setReactionWinner] = useState<number | null>(null);
  const [reactionScores, setReactionScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveGame('MENU');
      setRouletteState('idle');
      setChosenPlayer(null);
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    }
  }, [isOpen]);

  // Clean reaction game timeout on unmount
  useEffect(() => {
    return () => {
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // Sound chime helper
  const playBeep = (freq = 440, dur = 0.15) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {}
  };

  // Roulette Spin Handler
  const startRouletteSpin = () => {
    setRouletteState('spinning');
    playBeep(330, 0.1);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      playBeep(400 + Math.random() * 300, 0.08);
      if (count > 18) {
        clearInterval(interval);
        const selected = Math.floor(Math.random() * playerCount);
        setChosenPlayer(selected);
        setRouletteState('chosen');
        playBeep(880, 0.4);
      }
    }, 120);
  };

  // Start Reaction Round
  const startReactionRound = () => {
    setReactionStage('waiting');
    setReactionWinner(null);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);

    const delay = 1800 + Math.random() * 3500;
    reactionTimerRef.current = setTimeout(() => {
      setReactionStage('ready');
      playBeep(880, 0.3);
    }, delay);
  };

  const handleReactionTap = (pIdx: number) => {
    if (reactionStage === 'waiting') {
      // Early tap penalty
      playBeep(220, 0.2);
      return;
    }
    if (reactionStage === 'ready') {
      setReactionStage('tapped');
      setReactionWinner(pIdx);
      setReactionScores((prev) => {
        const next = [...prev];
        next[pIdx] = (next[pIdx] || 0) + 1;
        return next;
      });
      playBeep(1046, 0.35);
    }
  };

  const playerColors = [
    { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-400', name: 'Player 1' },
    { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-400', name: 'Player 2' },
    { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-400', name: 'Player 3' },
    { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-400', name: 'Player 4' },
    { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-400', name: 'Player 5' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
      <div className="bg-[#1A1412] text-cream-100 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-cream-200/10 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#140E0A] shrink-0">
          <div className="flex items-center gap-2.5">
            {activeGame !== 'MENU' && (
              <button
                onClick={() => setActiveGame('MENU')}
                className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/10 text-taupe-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-terracotta to-amber-600 text-white flex items-center justify-center shadow">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-cream-50 leading-tight">
                {activeGame === 'MENU'
                  ? 'Table Games & Party Fun'
                  : activeGame === 'ROULETTE'
                  ? 'Who Pays the Bill?'
                  : activeGame === 'TRIVIA'
                  ? 'Foodie Trivia Quiz'
                  : activeGame === 'TRUTH_OR_DARE'
                  ? 'Dining Truth or Dare'
                  : 'Speed Reaction Duel'}
              </h2>
              <p className="text-[11px] text-taupe-400">
                {activeGame === 'MENU' ? `${restaurantName} • While you wait` : `Pass & play • 2 to 5 players`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-taupe-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Count Bar (shown in all games) */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-taupe-300">
            <Users className="w-3.5 h-3.5 text-terracotta" />
            <span>Players at Table:</span>
          </div>
          <div className="flex items-center gap-1">
            {[2, 3, 4, 5].map((cnt) => (
              <button
                key={cnt}
                onClick={() => {
                  setPlayerCount(cnt);
                  setRouletteState('idle');
                  setChosenPlayer(null);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                  playerCount === cnt
                    ? 'bg-terracotta text-white shadow-sm ring-1 ring-white/30'
                    : 'bg-white/5 text-taupe-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        {/* Game Body Viewport */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* =========================================================================
              VIEW 1: GAMES SELECTION HUB
          ========================================================================= */}
          {activeGame === 'MENU' && (
            <div className="space-y-3">
              <p className="text-xs text-taupe-400 mb-2">
                Turn your dining table into an interactive lounge. Pick any game to play with friends or family while your food is being cooked:
              </p>

              {/* Game 1: Roulette */}
              <div
                onClick={() => {
                  setActiveGame('ROULETTE');
                  setRouletteState('idle');
                  setChosenPlayer(null);
                }}
                className="group p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-black/40 border border-rose-500/30 hover:border-rose-400 transition-all cursor-pointer shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                    💸
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-cream-50 group-hover:text-rose-300 transition-colors">
                      Who Pays the Bill?
                    </h3>
                    <p className="text-xs text-taupe-400 mt-0.5">
                      Tap Roulette: Everyone touches a pad; one random player is chosen to settle the check!
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-taupe-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </div>

              {/* Game 2: Trivia */}
              <div
                onClick={() => {
                  setActiveGame('TRIVIA');
                  setTriviaRound(0);
                  setSelectedAnswer(null);
                  setIsAnswerRevealed(false);
                }}
                className="group p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-black/40 border border-blue-500/30 hover:border-blue-400 transition-all cursor-pointer shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                    🧠
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-cream-50 group-hover:text-blue-300 transition-colors">
                      Foodie Trivia Quiz
                    </h3>
                    <p className="text-xs text-taupe-400 mt-0.5">
                      Pass-the-phone culinary trivia showdown with live score tracking across {playerCount} players.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-taupe-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </div>

              {/* Game 3: Truth or Dare */}
              <div
                onClick={() => {
                  setActiveGame('TRUTH_OR_DARE');
                  setTdCurrentIndex(0);
                  setTdActivePlayer(0);
                }}
                className="group p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-black/40 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                    🎭
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-cream-50 group-hover:text-amber-300 transition-colors">
                      Dining Truth or Dare
                    </h3>
                    <p className="text-xs text-taupe-400 mt-0.5">
                      Hilarious cafe conversation starters, food confessions, and harmless dinner table dares.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-taupe-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </div>

              {/* Game 4: Speed Reaction Duel */}
              <div
                onClick={() => {
                  setActiveGame('REACTION');
                  startReactionRound();
                }}
                className="group p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-black/40 border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-cream-50 group-hover:text-emerald-300 transition-colors">
                      Speed Reaction Duel
                    </h3>
                    <p className="text-xs text-taupe-400 mt-0.5">
                      Wait for the chef's bell... first player to tap their buzzer when it rings wins the round!
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-taupe-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: WHO PAYS THE BILL (TAP ROULETTE)
          ========================================================================= */}
          {activeGame === 'ROULETTE' && (
            <div className="space-y-6 text-center">
              <div className="space-y-1">
                <div className="text-3xl">💸</div>
                <h3 className="font-serif text-lg font-bold text-cream-50">
                  {rouletteState === 'chosen'
                    ? `🎉 ${playerColors[chosenPlayer!].name} Pays the Bill!`
                    : 'Place fingers or tap Spin to select!'}
                </h3>
                <p className="text-xs text-taupe-400">
                  {rouletteState === 'chosen'
                    ? 'Or they can treat the table to dessert & chai!'
                    : `Randomly picks 1 of the ${playerCount} diners.`}
                </p>
              </div>

              {/* Player Touch / Avatar Rings */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: playerCount }).map((_, idx) => {
                  const isWinner = rouletteState === 'chosen' && chosenPlayer === idx;
                  const isSpinning = rouletteState === 'spinning';
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                        isWinner
                          ? 'border-terracotta bg-terracotta/20 scale-105 shadow-xl ring-2 ring-terracotta/40'
                          : isSpinning
                          ? 'border-white/20 bg-white/5 animate-pulse'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full ${playerColors[idx].bg} text-white font-mono font-bold text-lg flex items-center justify-center shadow-md`}
                      >
                        P{idx + 1}
                      </div>
                      <span className="text-xs font-semibold text-cream-200">
                        {playerColors[idx].name}
                      </span>
                      {isWinner && (
                        <span className="text-[10px] font-bold text-terracotta uppercase tracking-wider animate-bounce">
                          Selected!
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Spin Action Button */}
              <div className="pt-2">
                <button
                  onClick={startRouletteSpin}
                  disabled={rouletteState === 'spinning'}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-terracotta to-amber-600 hover:opacity-95 text-white font-bold text-sm tracking-wide transition-all shadow-lifted active:scale-95 disabled:opacity-50"
                >
                  {rouletteState === 'spinning'
                    ? 'Spinning the Wheel...'
                    : rouletteState === 'chosen'
                    ? 'Spin Again'
                    : 'Spin & Pick Payer!'}
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: FOODIE TRIVIA QUIZ
          ========================================================================= */}
          {activeGame === 'TRIVIA' && (
            <div className="space-y-4">
              {/* Scoreboard Strip */}
              <div className="grid grid-cols-5 gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5 text-center">
                {Array.from({ length: playerCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 rounded-lg transition-all ${
                      triviaTurn === idx ? 'bg-terracotta/20 border border-terracotta/40' : ''
                    }`}
                  >
                    <div className="text-[10px] text-taupe-400 font-medium truncate">P{idx + 1}</div>
                    <div className="font-mono font-bold text-sm text-cream-100">
                      {triviaScores[idx] || 0}
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Question */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-taupe-400">
                  <span className="font-semibold text-terracotta">
                    {playerColors[triviaTurn].name}'s Turn
                  </span>
                  <span>Question {triviaRound + 1} of {TRIVIA_QUESTIONS.length}</span>
                </div>

                <h3 className="font-serif text-base sm:text-lg font-bold text-cream-50 leading-snug">
                  {TRIVIA_QUESTIONS[triviaRound % TRIVIA_QUESTIONS.length].q}
                </h3>

                <div className="space-y-2 pt-1">
                  {TRIVIA_QUESTIONS[triviaRound % TRIVIA_QUESTIONS.length].options.map((opt, optIdx) => {
                    const isCorrect = optIdx === TRIVIA_QUESTIONS[triviaRound % TRIVIA_QUESTIONS.length].answer;
                    const isSelected = selectedAnswer === optIdx;
                    let style = 'bg-white/5 border-white/10 hover:bg-white/10 text-cream-200';

                    if (isAnswerRevealed) {
                      if (isCorrect) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                      else if (isSelected) style = 'bg-rose-500/20 border-rose-500 text-rose-300';
                    }

                    return (
                      <button
                        key={opt}
                        disabled={isAnswerRevealed}
                        onClick={() => {
                          setSelectedAnswer(optIdx);
                          setIsAnswerRevealed(true);
                          if (isCorrect) {
                            playBeep(880, 0.2);
                            setTriviaScores((prev) => {
                              const next = [...prev];
                              next[triviaTurn] = (next[triviaTurn] || 0) + 1;
                              return next;
                            });
                          } else {
                            playBeep(220, 0.2);
                          }
                        }}
                        className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${style}`}
                      >
                        <span>{opt}</span>
                        {isAnswerRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Did you know reveal */}
                {isAnswerRevealed && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1 animate-fade-in">
                    <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" /> Culinary Fact
                    </span>
                    <p>{TRIVIA_QUESTIONS[triviaRound % TRIVIA_QUESTIONS.length].fact}</p>
                  </div>
                )}
              </div>

              {/* Next Question Button */}
              {isAnswerRevealed && (
                <button
                  onClick={() => {
                    setSelectedAnswer(null);
                    setIsAnswerRevealed(false);
                    setTriviaRound((r) => r + 1);
                    setTriviaTurn((t) => (t + 1) % playerCount);
                  }}
                  className="w-full py-3 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow"
                >
                  <span>Next Player's Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 4: DINING TRUTH OR DARE
          ========================================================================= */}
          {activeGame === 'TRUTH_OR_DARE' && (
            <div className="space-y-5 text-center">
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 inline-flex items-center gap-2 mx-auto text-xs text-taupe-300">
                <span>Current Turn:</span>
                <span className="font-bold text-terracotta">{playerColors[tdActivePlayer].name}</span>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#241B17] to-[#17100D] border border-white/10 shadow-lifted space-y-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    TRUTH_DARES[tdCurrentIndex % TRUTH_DARES.length].type === 'TRUTH'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {TRUTH_DARES[tdCurrentIndex % TRUTH_DARES.length].type}
                </span>

                <h3 className="font-serif text-lg sm:text-xl font-bold text-cream-50 leading-relaxed max-w-sm mx-auto">
                  "{TRUTH_DARES[tdCurrentIndex % TRUTH_DARES.length].text}"
                </h3>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    playBeep(520, 0.15);
                    setTdCurrentIndex((i) => i + 1);
                    setTdActivePlayer((p) => (p + 1) % playerCount);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-terracotta hover:bg-terracotta/90 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>Completed! Next Player</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 5: SPEED REACTION DUEL
          ========================================================================= */}
          {activeGame === 'REACTION' && (
            <div className="space-y-4 text-center">
              {/* Scoreboard */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: playerCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                  >
                    <span className="text-taupe-400 mr-1.5">P{idx + 1}:</span>
                    <span className="font-mono font-bold text-cream-100">
                      {reactionScores[idx] || 0} pts
                    </span>
                  </div>
                ))}
              </div>

              {/* Arena Display */}
              <div
                className={`p-8 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] ${
                  reactionStage === 'ready'
                    ? 'bg-amber-500/30 border-amber-400 animate-pulse'
                    : reactionStage === 'tapped'
                    ? 'bg-emerald-500/20 border-emerald-400'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {reactionStage === 'waiting' && (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-full border-2 border-taupe-500 border-t-transparent animate-spin mx-auto mb-2" />
                    <h3 className="font-serif text-base font-bold text-cream-50">
                      Get Ready... Wait for the Chef's Bell!
                    </h3>
                    <p className="text-[11px] text-taupe-400">Don't tap early or you lose the chance!</p>
                  </div>
                )}

                {reactionStage === 'ready' && (
                  <div className="space-y-1 animate-bounce">
                    <div className="text-4xl">🔔</div>
                    <h3 className="font-serif text-2xl font-black text-amber-300">
                      TAP YOUR BUZZER NOW!
                    </h3>
                  </div>
                )}

                {reactionStage === 'tapped' && (
                  <div className="space-y-1">
                    <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-1 animate-bounce" />
                    <h3 className="font-serif text-lg font-bold text-cream-50">
                      {playerColors[reactionWinner!].name} Was Fastest! (+1 Pt)
                    </h3>
                  </div>
                )}
              </div>

              {/* Buzzer Buttons for each player */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {Array.from({ length: playerCount }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleReactionTap(idx)}
                    className={`py-6 px-3 rounded-2xl ${playerColors[idx].bg} text-white font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>{playerColors[idx].name} Buzzer</span>
                  </button>
                ))}
              </div>

              {reactionStage === 'tapped' && (
                <button
                  onClick={startReactionRound}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-cream-100 text-xs font-semibold transition-all mt-2"
                >
                  Start Next Round ⚡
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

