import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, ArrowLeft } from 'lucide-react';
import type { AppState, Question } from '@/lib/types';
import { sfx } from '@/lib/sfx';

interface Props {
  state: AppState;
  onBack: () => void;
  onPick: (q: Question) => void;
  onMarkUsed: (id: string) => void;
}

export default function SpinnerView({ state, onBack, onPick, onMarkUsed }: Props) {
  const pool = useMemo(() => state.questions.filter((q) => !q.used), [state.questions]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [picked, setPicked] = useState<Question | null>(null);
  const [pickedNumber, setPickedNumber] = useState<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimer.current !== null) clearTimeout(revealTimer.current);
    };
  }, []);

  const spin = () => {
    if (spinning || pool.length === 0) return;
    setSpinning(true);
    setPicked(null);
    setPickedNumber(null);
    if (state.settings.soundEffects) sfx.spinStart();

    const count = Math.min(pool.length, 12);
    const segAng = 360 / count;
    // Pick the target segment first, then compute a rotation that lands the
    // pointer on that segment so the shown number always matches the wheel.
    const chosenIdx = Math.floor(Math.random() * count);
    const jitter = (Math.random() - 0.5) * (segAng * 0.6); // stay within the segment
    const segMid = chosenIdx * segAng + segAng / 2 + jitter;
    const targetMod = (((360 - segMid) % 360) + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + spins * 360 + delta;
    setRotation(finalRotation);

    if (state.settings.soundEffects && tickRef.current === null) {
      tickRef.current = window.setInterval(() => sfx.tick(), 140);
    }

    const duration = 4200;
    const t0 = performance.now();
    const tick = () => {
      const elapsed = performance.now() - t0;
      if (elapsed >= duration) {
        const chosen = pool[chosenIdx];
        setPicked(chosen);
        setPickedNumber(chosenIdx + 1);
        setSpinning(false);
        if (tickRef.current !== null) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
        if (state.settings.soundEffects) sfx.spinEnd();
        onMarkUsed(chosen.id);
        revealTimer.current = window.setTimeout(() => {
          onPick(chosen);
        }, 2600);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const segments = pool.length > 0 ? pool.slice(0, 12) : [];
  const segCount = Math.max(segments.length, 1);
  const segAngle = 360 / segCount;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="text-xs uppercase tracking-widest text-white/40">
          {pool.length} question{pool.length !== 1 ? 's' : ''} remaining
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="font-display text-5xl md:text-6xl mb-2">Lucky Question Spinner</h2>
        <p className="text-white/55">Spin to reveal your fate — no bias, no repeats</p>
      </motion.div>

      <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] mb-10">
        {/* Pointer */}
        <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 z-20 w-0 h-0
          border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent
          border-b-[26px] border-b-white drop-shadow-lg" />

        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4.2, ease: [0.17, 0.67, 0.21, 0.99] }}
          className="w-full h-full rounded-full border-[6px] border-white/15 relative overflow-hidden"
          style={{ background: '#0a0b1a' }}
        >
          {segments.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-center px-8 text-sm">
              No questions left. Reset the competition to play again.
            </div>
          ) : (
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {segments.map((q, i) => {
                const start = i * segAngle - 90;
                const end = start + segAngle;
                const r = 100;
                const x1 = 100 + r * Math.cos((start * Math.PI) / 180);
                const y1 = 100 + r * Math.sin((start * Math.PI) / 180);
                const x2 = 100 + r * Math.cos((end * Math.PI) / 180);
                const y2 = 100 + r * Math.sin((end * Math.PI) / 180);
                const large = segAngle > 180 ? 1 : 0;
                const path = `M100,100 L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
                const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7', '#f97316'];
                const fill = colors[i % colors.length];
                const mid = start + segAngle / 2;
                const tx = 100 + 62 * Math.cos((mid * Math.PI) / 180);
                const ty = 100 + 62 * Math.sin((mid * Math.PI) / 180);
                return (
                  <g key={q.id}>
                    <path d={path} fill={fill} fillOpacity={0.85} stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
                    <text
                      x={tx}
                      y={ty}
                      fill="white"
                      fontSize="13"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${mid + 90}, ${tx}, ${ty})`}
                    >
                      {`${i + 1}`}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </motion.div>

        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full glass-strong flex items-center justify-center z-10">
          <Shuffle className="w-8 h-8 text-white" />
        </div>
      </div>

      {picked ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass-strong rounded-3xl p-8 max-w-xl w-full text-center"
          >
            <div className="text-xs uppercase tracking-widest text-amber-300 mb-3">Question Selected</div>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
              className="font-display text-8xl mb-4 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent"
            >
              {pickedNumber}
            </motion.div>
            <div className="text-sm text-white/50 mb-3">{picked.section} · {picked.difficulty} · {picked.marks} marks</div>
            <div className="text-lg text-white/90 mb-4 line-clamp-2">{picked.question}</div>
            <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Revealing question…
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <button
          onClick={spin}
          disabled={spinning || pool.length === 0}
          className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-display text-2xl shadow-xl shadow-violet-500/30 transition hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Shuffle className="w-6 h-6" />
          {spinning ? 'Spinning…' : pool.length === 0 ? 'No questions left' : 'Spin the Wheel'}
        </button>
      )}

      {pool.length === 0 && (
        <button
          onClick={onBack}
          className="mt-6 text-white/50 hover:text-white underline underline-offset-4"
        >
          All questions used! Go back.
        </button>
      )}
    </div>
  );
}
