import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Timer, Check, X, ArrowRight } from 'lucide-react';
import type { AppState, Question } from '@/lib/types';
import { sfx } from '@/lib/sfx';

interface Props {
  state: AppState;
  question: Question;
  onBack: () => void;
  onScore: (groupId: string, delta: number) => void;
  onDone: () => void;
}

export default function QuestionView({ state, question, onBack, onScore, onDone }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [showOptions, setShowOptions] = useState(!state.settings.hideOptions);
  const [timer, setTimer] = useState(state.settings.timerSeconds);
  const [running, setRunning] = useState(false);
  const [scored, setScored] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setRevealed(false);
    setShowOptions(!state.settings.hideOptions);
    setTimer(state.settings.timerSeconds);
    setRunning(false);
    setScored({});
  }, [question.id, state.settings.timerSeconds, state.settings.hideOptions]);

  useEffect(() => {
    if (running && timer > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setRunning(false);
            if (state.settings.soundEffects) sfx.wrong();
            return 0;
          }
          if (state.settings.soundEffects && t <= 5) sfx.tick();
          return t - 1;
        });
      }, 1000);
      return () => {
        if (intervalRef.current !== null) clearInterval(intervalRef.current);
      };
    }
  }, [running, timer, state.settings.soundEffects]);

  const reveal = () => {
    setRevealed(true);
    if (state.settings.soundEffects) sfx.reveal();
  };

  const startTimer = () => {
    setTimer(state.settings.timerSeconds);
    setRunning(true);
  };

  const toggleOptions = () => {
    setShowOptions((v) => !v);
  };

  const markCorrect = (groupId: string) => {
    const correct = !scored[groupId];
    setScored((s) => ({ ...s, [groupId]: correct }));
    onScore(groupId, correct ? question.marks : -question.marks);
    if (state.settings.soundEffects) correct ? sfx.correct() : sfx.wrong();
  };

  const timerPct = state.settings.timerSeconds > 0
    ? (timer / state.settings.timerSeconds) * 283
    : 0;
  const timerColor = timer <= 5 ? '#ef4444' : timer <= 10 ? '#f59e0b' : '#10b981';

  const renderMedia = () => {
    if (!question.media?.url) return null;

    if (question.media.type === 'image') {
      return (
        <div className="mb-6">
          <img src={question.media.url} alt={question.media.alt || question.question} className="max-h-80 w-full object-contain rounded-2xl border border-white/10 bg-black/20" />
        </div>
      );
    }

    if (question.media.type === 'audio') {
      return (
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm text-white/60 mb-2">Audio clue</div>
          <audio controls className="w-full" src={question.media.url} />
        </div>
      );
    }

    if (question.media.type === 'video') {
      return (
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-3">
          <video controls className="w-full max-h-80 rounded-xl" src={question.media.url} />
        </div>
      );
    }

    if (question.media.type === 'youtube') {
      const embedUrl = question.media.url.replace('https://www.youtube.com/watch?v=', 'https://www.youtube.com/embed/').replace('https://youtu.be/', 'https://www.youtube.com/embed/');
      return (
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-3">
          <iframe
            className="w-full aspect-video rounded-xl"
            src={embedUrl}
            title={question.media.alt || question.question}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" /> Back to Spinner
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 uppercase tracking-widest text-white/60">
            {question.section}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 uppercase tracking-widest text-white/60">
            {question.difficulty}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 uppercase tracking-widest text-amber-300">
            {question.marks} marks
          </span>
        </div>
      </div>

      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-strong rounded-3xl p-8 md:p-14 relative overflow-hidden max-w-4xl mx-auto w-full"
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-2xl" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-pink-500/20 to-transparent blur-2xl" />

        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-4">Question</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">{question.question}</h2>
          {renderMedia()}

          {/* MCQ options */}
          {question.type === 'mcq' && (
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {(['A', 'B', 'C', 'D'] as const).map((k) => (
                <div
                  key={k}
                  className={`glass rounded-xl p-4 flex items-center gap-3 transition ${
                    showOptions ? 'opacity-100' : 'opacity-30 blur-sm select-none'
                  } ${revealed && question.answer === k ? 'ring-2 ring-emerald-400/60 bg-emerald-400/10' : ''}`}
                >
                  <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center font-display text-xl">{k}</span>
                  <span className="text-white/85">{question.options[k] || '—'}</span>
                </div>
              ))}
            </div>
          )}

          {/* True/False */}
          {question.type === 'truefalse' && (
            <div className="flex gap-3 mb-6">
              {['True', 'False'].map((opt) => (
                <div
                  key={opt}
                  className={`glass rounded-xl px-6 py-4 flex-1 text-center font-semibold transition ${
                    showOptions ? 'opacity-100' : 'opacity-30 blur-sm select-none'
                  } ${revealed && question.answer.toLowerCase() === opt.toLowerCase() ? 'ring-2 ring-emerald-400/60 bg-emerald-400/10' : ''}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}

          {/* Answer reveal */}
          {revealed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-medium mb-6"
            >
              <Check className="w-5 h-5" /> Answer: {question.answer}
              {question.type === 'mcq' && question.options[question.answer as 'A' | 'B' | 'C' | 'D'] && (
                <span className="text-white/60">— {question.options[question.answer as 'A' | 'B' | 'C' | 'D']}</span>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={reveal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold transition hover:scale-[1.03] active:scale-95"
              >
                <Eye className="w-5 h-5" /> Reveal Answer
              </button>
              {question.type !== 'text' && (
                <button
                  onClick={toggleOptions}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass text-white transition hover:bg-white/10"
                >
                  {showOptions ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showOptions ? 'Hide options' : 'Show options'}
                </button>
              )}
            </div>
          )}

          {/* Timer */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - timerPct}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-display text-3xl" style={{ color: timerColor }}>
                {timer}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Timer className="w-4 h-4" /> {running ? 'Running…' : timer === 0 ? 'Time up' : 'Ready'}
              </div>
              <button
                onClick={startTimer}
                disabled={running}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-white text-sm transition hover:bg-white/10 disabled:opacity-40"
              >
                <Timer className="w-4 h-4" /> {running ? 'Running' : 'Start timer'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scoring */}
      <div className="w-full max-w-4xl mx-auto mt-6">
        <div className="text-sm text-white/50 mb-3">Which house answered correctly?</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.groups.map((g) => {
            const correct = scored[g.id];
            return (
              <button
                key={g.id}
                onClick={() => markCorrect(g.id)}
                className={`glass rounded-2xl p-5 flex items-center gap-4 border-2 transition hover:bg-white/5 ${
                  correct ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-transparent'
                }`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-3xl shrink-0"
                  style={{ background: `${g.color}33`, border: `1px solid ${g.color}66` }}
                >
                  {g.emoji}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-xs text-white/50">{g.score} pts</div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${correct ? 'bg-emerald-400 text-black' : 'bg-white/10 text-white/40'}`}>
                  {correct ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto mt-8 flex justify-end">
        <button
          onClick={onDone}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold transition hover:scale-[1.03] active:scale-95"
        >
          Next Question <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
