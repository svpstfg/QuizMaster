import { motion } from 'framer-motion';
import { Sparkles, Play, Settings, BarChart3, Trophy, ArrowRight } from 'lucide-react';
import type { AppState } from '@/lib/types';

interface Props {
  state: AppState;
  onStart: () => void;
  onAdmin: () => void;
  onScoreboard: () => void;
}

export default function HomeView({ state, onStart, onAdmin, onScoreboard }: Props) {
  const totalQuestions = state.questions.length;
  const usedQuestions = state.questions.filter((q) => q.used).length;
  const ready = state.groups.length > 0 && state.questions.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-white/70 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Smart School Quiz Competition
        </div>

        <h1 className="font-display text-7xl md:text-8xl leading-none mb-5">
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            QUIZMASTER
          </span>
          <br />
          <span className="text-white">PRO</span>
        </h1>

        <p className="text-white/65 text-lg md:text-xl max-w-xl mx-auto mb-10">
          Bias-free quiz competitions with a Lucky Spinner and TV-show style presentation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={onStart}
            disabled={!ready}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-lg shadow-lg shadow-violet-500/25 transition hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Play className="w-5 h-5 fill-white" />
            Start Competition
            <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
          </button>
          <button
            onClick={onScoreboard}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass text-white font-medium transition hover:bg-white/10"
          >
            <BarChart3 className="w-5 h-5" />
            Live Scoreboard
          </button>
          <button
            onClick={onAdmin}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass text-white font-medium transition hover:bg-white/10"
          >
            <Settings className="w-5 h-5" />
            Admin Panel
          </button>
        </div>

        {!ready && (
          <p className="text-amber-300/80 text-sm mb-10">
            Add at least one house and one question in the Admin Panel to begin.
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl"
      >
        <StatCard icon={<Trophy className="w-5 h-5" />} label="Competing Houses" value={state.groups.length} accent="from-violet-500 to-fuchsia-500" />
        <StatCard icon={<Sparkles className="w-5 h-5" />} label="Questions" value={totalQuestions} accent="from-emerald-400 to-teal-500" />
        <StatCard icon={<Play className="w-5 h-5" />} label="Asked" value={usedQuestions} accent="from-amber-400 to-orange-500" />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Total Points" value={state.groups.reduce((s, g) => s + g.score, 0)} accent="from-sky-400 to-blue-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid md:grid-cols-3 gap-4 w-full max-w-4xl mt-6"
      >
        <Feature title="Lucky Spinner" desc="Pick a random question — no bias, no repeats." />
        <Feature title="Live Scoreboard" desc="See the standings & crown a winner." />
        <Feature title="Bulk Import" desc="Add questions from a simple CSV paste." />
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="font-display text-3xl leading-none">{value}</div>
        <div className="text-xs text-white/50 uppercase tracking-wider mt-1">{label}</div>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="font-semibold text-white/90 mb-1">{title}</div>
      <div className="text-sm text-white/50">{desc}</div>
    </div>
  );
}
