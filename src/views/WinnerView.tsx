import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Crown, RotateCcw, Home } from 'lucide-react';
import type { AppState } from '@/lib/types';
import { sfx } from '@/lib/sfx';

interface Props {
  state: AppState;
  onReset: () => void;
  onHome: () => void;
}

export default function WinnerView({ state, onReset, onHome }: Props) {
  const ranked = [...state.groups].sort((a, b) => b.score - a.score);
  const winner = ranked[0];

  useEffect(() => {
    if (!winner) return;
    if (state.settings.soundEffects) sfx.fanfare();
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    const end = Date.now() + 2500;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });
  }, [winner, state.settings.soundEffects]);

  if (!winner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-white/60">No houses to declare a winner.</p>
          <button onClick={onHome} className="mt-4 px-5 py-2.5 rounded-xl glass hover:bg-white/10 transition">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/30"
      >
        <Crown className="w-12 h-12 text-black" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-xs uppercase tracking-[0.3em] text-amber-300 mb-3">Champion</div>
        <h1 className="font-display text-7xl md:text-8xl mb-4">
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            {winner.name}
          </span>
        </h1>
        <div className="text-6xl mb-6">{winner.emoji}</div>
        <div className="font-display text-5xl text-white mb-2">{winner.score} <span className="text-white/40 text-2xl">points</span></div>
      </motion.div>

      {/* Podium for the rest */}
      {ranked.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-2xl mt-12"
        >
          <div className="text-xs uppercase tracking-widest text-white/40 mb-4">Final Standings</div>
          <div className="space-y-2">
            {ranked.map((g, i) => (
              <div key={g.id} className="glass rounded-xl p-4 flex items-center gap-4">
                <div className="font-display text-2xl w-8 text-white/40">{i + 1}</div>
                <div className="text-2xl">{g.emoji}</div>
                <div className="flex-1 text-left font-medium">{g.name}</div>
                <div className="font-display text-2xl" style={{ color: g.color }}>{g.score}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-3 mt-10">
        <button
          onClick={onHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-medium transition hover:bg-white/10"
        >
          <Home className="w-5 h-5" /> Home
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold transition hover:scale-[1.03] active:scale-95"
        >
          <RotateCcw className="w-5 h-5" /> New Competition
        </button>
      </div>
    </div>
  );
}
