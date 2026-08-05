export type QuestionType = 'text' | 'mcq' | 'truefalse';
export type QuestionMediaType = 'image' | 'audio' | 'video' | 'youtube';

export interface QuestionMedia {
  type: QuestionMediaType;
  url: string;
  alt?: string;
}

export interface Question {
  id: string;
  section: string;
  question: string;
  answer: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options: { A: string; B: string; C: string; D: string };
  media?: QuestionMedia;
  used: boolean;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  color: string;
  score: number;
}

export interface Settings {
  soundEffects: boolean;
  timerSeconds: number;
  hideOptions: boolean;
  defaultMarks: number;
}

export interface CompetitionMeta {
  name: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface AppState {
  groups: Group[];
  questions: Question[];
  settings: Settings;
  competition: CompetitionMeta;
}

export const DEFAULT_SETTINGS: Settings = {
  soundEffects: true,
  timerSeconds: 30,
  hideOptions: true,
  defaultMarks: 10,
};

export const HOUSE_COLORS = [
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#a855f7',
  '#f97316',
];

export const HOUSE_EMOJIS = ['🦁', '🦅', '🐉', '🐺', '🦈', '🦊', '🐻', '🦉'];

export const SAMPLE_JSON = `[
  {
    "section": "Science",
    "question": "What is H2O commonly known as?",
    "answer": "Water",
    "type": "text",
    "difficulty": "easy",
    "marks": 10,
    "options": { "A": "", "B": "", "C": "", "D": "" }
  },
  {
    "section": "MCQ Round",
    "question": "Which is the tallest mountain?",
    "answer": "A",
    "type": "mcq",
    "difficulty": "easy",
    "marks": 10,
    "options": { "A": "Mount Everest", "B": "K2", "C": "Kangchenjunga", "D": "Lhotse" }
  },
  {
    "section": "True or False",
    "question": "The sun rises in the west",
    "answer": "False",
    "type": "truefalse",
    "difficulty": "easy",
    "marks": 10,
    "options": { "A": "", "B": "", "C": "", "D": "" }
  }
]`;

export const SAMPLE_CSV = `section,question,answer,type,difficulty,marks,optionA,optionB,optionC,optionD
Science,What is H2O commonly known as?,Water,text,easy,10,,,,
History,Who discovered penicillin?,Alexander Fleming,text,medium,15,,,,
MCQ Round,Which is the tallest mountain?,A,mcq,easy,10,Mount Everest,K2,Kangchenjunga,Lhotse
True or False,The sun rises in the west,False,truefalse,easy,10,,,,
Geography,What is the capital of Japan?,Tokyo,text,medium,10,,,,
Math,What is 7 multiplied by 8?,56,text,easy,10,,,,
MCQ Round,Which planet is known as the Red Planet?,B,mcq,medium,15,Mars,Jupiter,Venus,Saturn
Science,What gas do plants absorb from the atmosphere?,Carbon dioxide,text,medium,15,,,,
True or False,The Great Wall of China is visible from space,False,truefalse,hard,20,,,,
Literature,Who wrote Romeo and Juliet?,William Shakespeare,text,medium,15,,,,
MCQ Round,Which is the largest ocean on Earth?,C,mcq,easy,10,Atlantic,Indian,Pacific,Arctic
History,In which year did World War II end?,1945,text,medium,15,,,,`;

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function normalizeQuestionMedia(input: unknown, fallback?: Record<string, unknown>): QuestionMedia | undefined {
  const candidate = (typeof input === 'object' && input !== null ? input as Record<string, unknown> : undefined) ?? fallback;
  if (!candidate) return undefined;

  const typeValue = typeof candidate.type === 'string' ? candidate.type : typeof candidate.mediaType === 'string' ? candidate.mediaType : '';
  const urlValue = typeof candidate.url === 'string' ? candidate.url : typeof candidate.mediaUrl === 'string' ? candidate.mediaUrl : '';
  const altValue = typeof candidate.alt === 'string' ? candidate.alt : typeof candidate.mediaAlt === 'string' ? candidate.mediaAlt : '';

  const normalizedType = typeValue === 'image' || typeValue === 'audio' || typeValue === 'video' || typeValue === 'youtube'
    ? typeValue
    : undefined;

  if (!normalizedType || !urlValue) return undefined;

  return {
    type: normalizedType,
    url: urlValue,
    alt: altValue || undefined,
  };
}

export function parseJsonQuestions(text: string): Omit<Question, 'id' | 'used'>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const arr = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { questions?: unknown[] })?.questions) ? (parsed as { questions: unknown[] }).questions : [];
  return arr
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => {
      const type = ((r.type as string) || 'text') as QuestionType;
      const difficulty = ((r.difficulty as string) || 'medium') as Question['difficulty'];
      const opts = (r.options as Record<string, string>) || {};
      const media = normalizeQuestionMedia(r.media, r);
      return {
        section: (r.section as string) || 'General',
        question: (r.question as string) || '',
        answer: (r.answer as string) || '',
        type,
        difficulty,
        marks: Number(r.marks) || 10,
        options: {
          A: opts.A || opts.a || '',
          B: opts.B || opts.b || '',
          C: opts.C || opts.c || '',
          D: opts.D || opts.d || '',
        },
        media,
      } as Omit<Question, 'id' | 'used'>;
    })
    .filter((q) => q.question && q.answer);
}

export function emptyState(): AppState {
  return {
    groups: [],
    questions: [],
    settings: { ...DEFAULT_SETTINGS },
    competition: { name: 'QuizMaster Pro', startedAt: null, finishedAt: null },
  };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
