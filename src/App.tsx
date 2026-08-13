import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuizState } from '@/lib/useQuizState';
import type { Question } from '@/lib/types';
import HomeView from '@/views/HomeView';
import SpinnerView from '@/views/SpinnerView';
import QuestionView from '@/views/QuestionView';
import ScoreboardView from '@/views/ScoreboardView';
import WinnerView from '@/views/WinnerView';
import AdminView from '@/views/AdminView';

type View = 'home' | 'spinner' | 'question' | 'scoreboard' | 'winner' | 'admin';

export default function App() {
  const quiz = useQuizState();
  const [view, setView] = useState<View>('home');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  if (quiz.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/70">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading QuizMaster Pro…
        </div>
      </div>
    );
  }

  const goHome = () => setView('home');

  const startCompetition = () => {
    quiz.startCompetition();
    setView('spinner');
  };

  const pickQuestion = (q: Question) => {
    setActiveQuestion(q);
    setView('question');
  };

  const finishQuestion = () => {
    setActiveQuestion(null);
    setView('scoreboard');
  };

  return (
    <div className="min-h-screen text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {view === 'home' && (
            <HomeView
              state={quiz.state}
              onStart={startCompetition}
              onAdmin={() => setView('admin')}
              onScoreboard={() => setView('scoreboard')}
            />
          )}
          {view === 'spinner' && (
            <SpinnerView
              state={quiz.state}
              onBack={goHome}
              onPick={pickQuestion}
              onMarkUsed={quiz.markUsed}
            />
          )}
          {view === 'question' && activeQuestion && (
            <QuestionView
              state={quiz.state}
              question={activeQuestion}
              onBack={() => setView('spinner')}
              onScore={quiz.addScore}
              onDone={finishQuestion}
            />
          )}
          {view === 'scoreboard' && (
            <ScoreboardView
              state={quiz.state}
              onBack={goHome}
              onSpin={() => setView('spinner')}
              onReset={quiz.resetCompetition}
              onDeclareWinner={() => {
                quiz.declareWinner();
                setView('winner');
              }}
            />
          )}
          {view === 'winner' && (
            <WinnerView
              state={quiz.state}
              onReset={() => {
                quiz.resetCompetition();
                setView('home');
              }}
              onHome={goHome}
            />
          )}
          {view === 'admin' && (
            <AdminView
              state={quiz.state}
              onBack={goHome}
              onAddQuestion={quiz.addQuestion}
              onBulkAdd={quiz.bulkAddQuestions}
              onRemoveQuestion={quiz.removeQuestion}
              onAddGroup={quiz.addGroup}
              onRemoveGroup={quiz.removeGroup}
              onUpdateSettings={quiz.updateSettings}
              onLoadSampleQuestions={quiz.loadSampleQuestions}
              onLoadSampleGroups={quiz.loadSampleGroups}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
