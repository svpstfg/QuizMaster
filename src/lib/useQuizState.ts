import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AppState, emptyState, Group, Question, Settings, uid, HOUSE_COLORS, HOUSE_EMOJIS, SAMPLE_CSV } from '@/lib/types';

const ROW_ID = 1;

function mergeState(data: unknown): AppState {
  const base = emptyState();
  if (!data || typeof data !== 'object') return base;
  const d = data as Partial<AppState>;
  return {
    groups: Array.isArray(d.groups) ? d.groups : base.groups,
    questions: Array.isArray(d.questions) ? d.questions : base.questions,
    settings: { ...base.settings, ...(d.settings || {}) },
    competition: { ...base.competition, ...(d.competition || {}) },
  };
}

export function useQuizState() {
  const [state, setState] = useState<AppState>(emptyState);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    const { data, error } = await supabase
      .from('quiz_state')
      .select('data')
      .eq('id', ROW_ID)
      .maybeSingle();
    if (error) {
      console.error('fetch state error', error);
      setLoading(false);
      return;
    }
    setState(mergeState(data?.data));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchState();

    const channel = supabase
      .channel('quiz_state_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_state' },
        (payload) => {
          const row = payload.new as { data: unknown } | null;
          if (row?.data) setState(mergeState(row.data));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchState]);

  const save = useCallback(async (next: AppState) => {
    setState(next);
    const { error } = await supabase
      .from('quiz_state')
      .update({ data: next as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
      .eq('id', ROW_ID);
    if (error) console.error('save state error', error);
  }, []);

  // --- Mutations ---------------------------------------------------------

  const addGroup = useCallback(
    (name: string, emoji: string, color: string) => {
      const group: Group = { id: uid(), name, emoji, color, score: 0 };
      save({ ...state, groups: [...state.groups, group] });
    },
    [state, save],
  );

  const removeGroup = useCallback(
    (id: string) => {
      save({ ...state, groups: state.groups.filter((g) => g.id !== id) });
    },
    [state, save],
  );

  const addQuestion = useCallback(
    (q: Omit<Question, 'id' | 'used'>) => {
      const question: Question = { ...q, id: uid(), used: false };
      save({ ...state, questions: [...state.questions, question] });
    },
    [state, save],
  );

  const bulkAddQuestions = useCallback(
    (items: Omit<Question, 'id' | 'used'>[]) => {
      const questions: Question[] = items.map((q) => ({ ...q, id: uid(), used: false }));
      save({ ...state, questions: [...state.questions, ...questions] });
      return questions.length;
    },
    [state, save],
  );

  const removeQuestion = useCallback(
    (id: string) => {
      save({ ...state, questions: state.questions.filter((q) => q.id !== id) });
    },
    [state, save],
  );

  const updateQuestion = useCallback(
    (id: string, patch: Omit<Question, 'id' | 'used'>) => {
      save({
        ...state,
        questions: state.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      });
    },
    [state, save],
  );

  const markUsed = useCallback(
    (id: string) => {
      save({
        ...state,
        questions: state.questions.map((q) => (q.id === id ? { ...q, used: true } : q)),
      });
    },
    [state, save],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      save({ ...state, settings: { ...state.settings, ...patch } });
    },
    [state, save],
  );

  const addScore = useCallback(
    (groupId: string, delta: number) => {
      save({
        ...state,
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, score: g.score + delta } : g,
        ),
      });
    },
    [state, save],
  );

  const startCompetition = useCallback(() => {
    save({
      ...state,
      competition: { ...state.competition, startedAt: new Date().toISOString(), finishedAt: null },
    });
  }, [state, save]);

  const resetCompetition = useCallback(() => {
    save({
      ...state,
      groups: state.groups.map((g) => ({ ...g, score: 0 })),
      questions: state.questions.map((q) => ({ ...q, used: false })),
      competition: { ...state.competition, startedAt: null, finishedAt: null },
    });
  }, [state, save]);

  const declareWinner = useCallback(() => {
    save({
      ...state,
      competition: { ...state.competition, finishedAt: new Date().toISOString() },
    });
  }, [state, save]);

  const loadSampleQuestions = useCallback(() => {
    const parsed = parseBulk(SAMPLE_CSV);
    save({ ...state, questions: parsed.map((q) => ({ ...q, id: uid(), used: false })) });
    return parsed.length;
  }, [state, save]);

  const loadSampleGroups = useCallback(() => {
    const groups: Group[] = [
      { id: uid(), name: 'Lions', emoji: '🦁', color: HOUSE_COLORS[0], score: 0 },
      { id: uid(), name: 'Eagles', emoji: '🦅', color: HOUSE_COLORS[1], score: 0 },
      { id: uid(), name: 'Dragons', emoji: '🐉', color: HOUSE_COLORS[2], score: 0 },
      { id: uid(), name: 'Wolves', emoji: '🐺', color: HOUSE_COLORS[3], score: 0 },
    ];
    save({ ...state, groups: groups });
    return groups.length;
  }, [state, save]);

  return {
    state,
    loading,
    addGroup,
    removeGroup,
    addQuestion,
    bulkAddQuestions,
    removeQuestion,
    updateQuestion,
    markUsed,
    updateSettings,
    addScore,
    startCompetition,
    resetCompetition,
    declareWinner,
    loadSampleQuestions,
    loadSampleGroups,
  };
}

export function parseBulk(text: string): Omit<Question, 'id' | 'used'>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows: Omit<Question, 'id' | 'used'>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (cols[idx] || '').trim() : '';
    };
    const section = get('section') || 'General';
    const question = get('question');
    const answer = get('answer');
    if (!question || !answer) continue;
    const type = (get('type') || 'text') as Question['type'];
    const difficulty = (get('difficulty') || 'medium') as Question['difficulty'];
    const marks = Number(get('marks')) || 10;
    rows.push({
      section,
      question,
      answer,
      type,
      difficulty,
      marks,
      options: {
        A: get('optiona'),
        B: get('optionb'),
        C: get('optionc'),
        D: get('optiond'),
      },
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}
