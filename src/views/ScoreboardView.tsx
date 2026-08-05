import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, RotateCcw, Crown, Shuffle } from 'lucide-react';
import type { AppState } from '@/lib/types';

interface Props {
  state: AppState;
  onBack: () => void;
  onSpin: () => void;
  onReset: () => void;
  onDeclareWinner: () => void;
}

export default function ScoreboardView({ state, onBack, onSpin, onReset, onDeclareWinner }: Props) {
  const ranked = [...state.groups].sort((a, b) => b.score - a.score);
  const max = Math.max(...ranked.map((g) => g.score), 1);
  const leader = ranked[0];

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-white/80 transition hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={onDeclareWinner}
            disabled={ranked.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-sm transition hover:scale-[1.03] active:scale-95 disabled:opacity-40"
          >
            <Crown className="w-4 h-4" /> Declare Winner
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="font-display text-5xl md:text-6xl mb-2">Live Scoreboard</h2>
        <p className="text-white/55">Live standings across all competing houses</p>
      </motion.div>

      {ranked.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-white/50 max-w-xl mx-auto">
          No houses yet. Add some in the Admin Panel.
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto space-y-3">
          {ranked.map((g, i) => {
            const pct = (g.score / max) * 100;
            const isLeader = i === 0 && g.score > 0;
            return (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-5 relative overflow-hidden"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-2xl transition-all duration-700"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${g.color}33, transparent)` }}
                />
                <div className="relative flex items-center gap-4">
                  <div className="font-display text-3xl w-8 text-white/40">{i + 1}</div>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-3xl shrink-0"
                    style={{ background: `${g.color}33`, border: `1px solid ${g.color}66` }}
                  >
                    {g.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg truncate">{g.name}</span>
                      {isLeader && <Trophy className="w-4 h-4 text-amber-300 shrink-0" />}
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: g.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <div className="font-display text-3xl tabular-nums" style={{ color: g.color }}>
                    {g.score}
                    <span className="text-sm text-white/40 ml-1">pts</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto mt-8 flex justify-center">
        <button
          onClick={onSpin}
          disabled={state.questions.filter((q) => !q.used).length === 0}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold transition hover:scale-[1.03] active:scale-95 disabled:opacity-40"
        >
          <Shuffle className="w-5 h-5" /> Spin Next Question
        </button>
      </div>
    </div>
  );
}
