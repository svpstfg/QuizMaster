import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Upload, FileText, Users, Settings as SettingsIcon,
  Volume2, VolumeX, Timer, Eye, EyeOff, Sparkles, FileJson, Download,
} from 'lucide-react';
import type { AppState, Question, QuestionType } from '@/lib/types';
import { HOUSE_COLORS, HOUSE_EMOJIS, SAMPLE_CSV, SAMPLE_JSON, downloadJson, parseJsonQuestions } from '@/lib/types';
import { parseBulk } from '@/lib/useQuizState';

type Tab = 'questions' | 'groups' | 'settings';

interface Props {
  state: AppState;
  onBack: () => void;
  onAddQuestion: (q: Omit<Question, 'id' | 'used'>) => void;
  onBulkAdd: (items: Omit<Question, 'id' | 'used'>[]) => number;
  onRemoveQuestion: (id: string) => void;
  onUpdateQuestion: (id: string, patch: Omit<Question, 'id' | 'used'>) => void;
  onAddGroup: (name: string, emoji: string, color: string) => void;
  onRemoveGroup: (id: string) => void;
  onUpdateSettings: (patch: Partial<AppState['settings']>) => void;
  onLoadSampleQuestions: () => number;
  onLoadSampleGroups: () => number;
}

export default function AdminView(props: Props) {
  const { state, onBack } = props;
  const [tab, setTab] = useState<Tab>('questions');

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h2 className="font-display text-3xl">Admin Panel</h2>
          <div className="w-20" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 glass rounded-2xl p-2 w-fit">
          <TabBtn active={tab === 'questions'} onClick={() => setTab('questions')} icon={<FileText className="w-4 h-4" />} label="Questions" />
          <TabBtn active={tab === 'groups'} onClick={() => setTab('groups')} icon={<Users className="w-4 h-4" />} label="Houses" />
          <TabBtn active={tab === 'settings'} onClick={() => setTab('settings')} icon={<SettingsIcon className="w-4 h-4" />} label="Settings" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'questions' && <QuestionsTab {...props} />}
            {tab === 'groups' && <GroupsTab {...props} />}
            {tab === 'settings' && <SettingsTab {...props} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
        active ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon} {label}
    </button>
  );
}

// --- Questions tab -------------------------------------------------------

function QuestionsTab({ state, onAddQuestion, onBulkAdd, onRemoveQuestion, onUpdateQuestion, onLoadSampleQuestions }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const clean = state.questions.map(({ id, used, ...rest }) => rest);
    downloadJson('quizmaster-questions.json', clean);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const items = parseJsonQuestions(text);
      if (items.length > 0) onBulkAdd(items);
      setShowJson(false);
    };
    reader.readAsText(file);
  };
  const [form, setForm] = useState<Omit<Question, 'id' | 'used'>>({
    section: 'General Knowledge',
    question: '',
    answer: '',
    type: 'text',
    difficulty: 'medium',
    marks: 10,
    options: { A: '', B: '', C: '', D: '' },
    media: undefined,
  });

  const resetForm = () => {
    setForm({
      section: 'General Knowledge',
      question: '',
      answer: '',
      type: 'text',
      difficulty: 'medium',
      marks: 10,
      options: { A: '', B: '', C: '', D: '' },
      media: undefined,
    });
  };

  const submit = () => {
    if (!form.question || !form.answer) return;
    if (editingId) {
      onUpdateQuestion(editingId, form);
      setEditingId(null);
    } else {
      onAddQuestion(form);
    }
    resetForm();
    setShowAdd(false);
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      section: q.section,
      question: q.question,
      answer: q.answer,
      type: q.type,
      difficulty: q.difficulty,
      marks: q.marks,
      options: { ...q.options },
      media: q.media,
    });
    setShowAdd(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    resetForm();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setShowAdd((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-medium transition hover:scale-[1.02]">
          <Plus className="w-4 h-4" /> New Question
        </button>
        <button onClick={() => setShowBulk((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-white text-sm font-medium transition hover:bg-white/10">
          <Upload className="w-4 h-4" /> CSV Import
        </button>
        <button onClick={() => setShowJson((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-white text-sm font-medium transition hover:bg-white/10">
          <FileJson className="w-4 h-4" /> JSON Import
        </button>
        <button onClick={exportJson} disabled={state.questions.length === 0} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-white text-sm font-medium transition hover:bg-white/10 disabled:opacity-40">
          <Download className="w-4 h-4" /> Export JSON
        </button>
        <button
          onClick={() => { const n = onLoadSampleQuestions(); if (n) { setShowBulk(false); setShowJson(false); } }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-white text-sm font-medium transition hover:bg-white/10"
        >
          <Sparkles className="w-4 h-4" /> Load sample
        </button>
        <div className="ml-auto text-sm text-white/40 self-center">{state.questions.length} questions</div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-strong rounded-2xl p-5 mb-4 overflow-hidden"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Section"><input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className={inputCls} /></Field>
              <Field label="Type">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })} className={inputCls}>
                  <option value="text">Text</option>
                  <option value="mcq">MCQ</option>
                  <option value="truefalse">True / False</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Question"><textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className={inputCls} rows={2} /></Field>
              </div>
              <Field label="Answer">
                <input value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className={inputCls} placeholder={form.type === 'mcq' ? 'A / B / C / D' : 'Answer'} />
              </Field>
              <Field label="Difficulty">
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Question['difficulty'] })} className={inputCls}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
              <Field label="Marks"><input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} className={inputCls} /></Field>
              <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-black/10 p-3">
                <div className="text-sm font-medium mb-2">Media attachment (optional)</div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <Field label="Type">
                    <select
                      value={form.media?.type || ''}
                      onChange={(e) => setForm({
                        ...form,
                        media: {
                          type: (e.target.value as Question['media'] extends undefined ? never : Question['media']['type']) || 'image',
                          url: form.media?.url || '',
                          alt: form.media?.alt || '',
                        },
                      })}
                      className={inputCls}
                    >
                      <option value="">None</option>
                      <option value="image">Image</option>
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                      <option value="youtube">YouTube</option>
                    </select>
                  </Field>
                  <Field label="URL">
                    <input
                      value={form.media?.url || ''}
                      onChange={(e) => setForm({
                        ...form,
                        media: form.media ? { ...form.media, url: e.target.value } : { type: 'image', url: e.target.value },
                      })}
                      className={inputCls}
                      placeholder="https://..."
                    />
                  </Field>
                  <Field label="Alt text">
                    <input
                      value={form.media?.alt || ''}
                      onChange={(e) => setForm({
                        ...form,
                        media: form.media ? { ...form.media, alt: e.target.value } : { type: 'image', url: '', alt: e.target.value },
                      })}
                      className={inputCls}
                      placeholder="Describe the media"
                    />
                  </Field>
                </div>
              </div>
              {form.type === 'mcq' && (
                <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((k) => (
                    <Field key={k} label={`Option ${k}`}>
                      <input value={form.options[k]} onChange={(e) => setForm({ ...form, options: { ...form.options, [k]: e.target.value } })} className={inputCls} />
                    </Field>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={submit} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-medium">{editingId ? 'Save Changes' : 'Add Question'}</button>
              <button onClick={cancelEdit} className="px-5 py-2.5 rounded-xl glass text-white/70 text-sm hover:bg-white/10">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulk && (
          <BulkImport
            onImport={(text) => {
              const items = parseBulk(text);
              const n = onBulkAdd(items);
              setShowBulk(false);
              return n;
            }}
            onClose={() => setShowBulk(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJson && (
          <JsonImport
            onImportText={(text) => {
              const items = parseJsonQuestions(text);
              const n = onBulkAdd(items);
              setShowJson(false);
              return n;
            }}
            onImportFile={handleFile}
            onClose={() => setShowJson(false)}
          />
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      {/* Question list */}
      <div className="space-y-2">
        {state.questions.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/50">
            No questions yet. Add one or load the sample set.
          </div>
        ) : (
          state.questions.map((q) => (
            <div key={q.id} className="glass rounded-xl p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full uppercase tracking-widest text-white/50">{q.section}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full uppercase tracking-widest text-white/50">{q.type}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full uppercase tracking-widest text-white/50">{q.difficulty}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-400/15 text-amber-300 rounded-full">{q.marks} marks</span>
                  {q.used && <span className="text-[10px] px-2 py-0.5 bg-emerald-400/15 text-emerald-300 rounded-full uppercase tracking-widest">used</span>}
                </div>
                <div className="text-white/90 truncate">{q.question}</div>
                {q.media?.url && <div className="text-xs text-violet-300 mt-1">Media: {q.media.type} • {q.media.url}</div>}
                <div className="text-xs text-white/40">Answer: {q.answer}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(q)} className="px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition">
                  Edit
                </button>
                <button onClick={() => onRemoveQuestion(q.id)} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BulkImport({ onImport, onClose }: { onImport: (text: string) => number; onClose: () => void }) {
  const [text, setText] = useState('');
  const preview = text ? parseBulk(text) : [];
  const valid = preview.filter((r) => r.question && r.answer);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-strong rounded-2xl p-5 mb-4 overflow-hidden"
    >
      <div className="text-sm text-white/60 mb-2">
        CSV format: <code className="px-2 py-0.5 bg-white/5 rounded text-xs">section, question, answer, type, difficulty, marks, optionA, optionB, optionC, optionD</code>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={SAMPLE_CSV}
        className={inputCls + ' font-mono text-xs'}
      />
      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-white/50">
          {valid.length > 0 ? `${valid.length} valid row${valid.length !== 1 ? 's' : ''} ready` : 'Paste CSV to preview'}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setText(SAMPLE_CSV)} className="px-4 py-2 rounded-xl glass text-white/70 text-sm hover:bg-white/10">Load sample</button>
          <button onClick={() => { const n = onImport(text); if (n === 0) return; }} className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-medium">Import {valid.length > 0 ? `(${valid.length})` : ''}</button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl glass text-white/70 text-sm hover:bg-white/10">Cancel</button>
        </div>
      </div>
    </motion.div>
  );
}

function JsonImport({
  onImportText,
  onImportFile,
  onClose,
}: {
  onImportText: (text: string) => number;
  onImportFile: (file: File) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preview = text ? parseJsonQuestions(text) : [];
  const valid = preview;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-strong rounded-2xl p-5 mb-4 overflow-hidden"
    >
      <div className="text-sm text-white/60 mb-2">
        JSON format: an array of question objects.{' '}
        <button
          onClick={() => downloadJson('quizmaster-template.json', JSON.parse(SAMPLE_JSON))}
          className="text-violet-300 hover:text-violet-200 underline underline-offset-2"
        >
          Download template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onImportFile(f);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition mb-3 ${
          dragging ? 'border-violet-400 bg-violet-400/10' : 'border-white/15 hover:border-white/30 hover:bg-white/5'
        }`}
      >
        <FileJson className="w-8 h-8 mx-auto mb-2 text-white/50" />
        <div className="text-sm text-white/70">Drop a .json file here or click to browse</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="text-xs text-white/40 mb-2">…or paste JSON below</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={SAMPLE_JSON}
        className={inputCls + ' font-mono text-xs'}
      />
      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-white/50">
          {valid.length > 0 ? `${valid.length} valid question${valid.length !== 1 ? 's' : ''} ready` : 'Paste or drop JSON to preview'}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setText(SAMPLE_JSON)} className="px-4 py-2 rounded-xl glass text-white/70 text-sm hover:bg-white/10">Load sample</button>
          <button onClick={() => { const n = onImportText(text); if (n === 0) return; }} className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-medium">Import {valid.length > 0 ? `(${valid.length})` : ''}</button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl glass text-white/70 text-sm hover:bg-white/10">Cancel</button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Groups tab ---------------------------------------------------------

function GroupsTab({ state, onAddGroup, onRemoveGroup, onLoadSampleGroups }: Props) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(HOUSE_EMOJIS[0]);
  const [color, setColor] = useState(HOUSE_COLORS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onAddGroup(name.trim(), emoji, color);
    setName('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => onLoadSampleGroups()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-white text-sm font-medium transition hover:bg-white/10">
          <Sparkles className="w-4 h-4" /> Load sample houses
        </button>
        <div className="ml-auto text-sm text-white/40 self-center">{state.groups.length} houses</div>
      </div>

      <div className="glass-strong rounded-2xl p-5 mb-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="House name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Lions" /></Field>
          <Field label="Emoji">
            <select value={emoji} onChange={(e) => setEmoji(e.target.value)} className={inputCls}>
              {HOUSE_EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
            </select>
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {HOUSE_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110' : ''}`} style={{ background: c }} />
              ))}
            </div>
          </Field>
        </div>
        <button onClick={submit} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add House
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {state.groups.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/50 sm:col-span-2 lg:col-span-3">
            No houses yet. Add one or load the sample set.
          </div>
        ) : (
          state.groups.map((g) => (
            <div key={g.id} className="glass rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-3xl shrink-0" style={{ background: `${g.color}33`, border: `1px solid ${g.color}66` }}>
                {g.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{g.name}</div>
                <div className="text-xs text-white/50">{g.score} pts</div>
              </div>
              <button onClick={() => onRemoveGroup(g.id)} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Settings tab -------------------------------------------------------

function SettingsTab({ state, onUpdateSettings }: Props) {
  const s = state.settings;
  return (
    <div className="glass-strong rounded-2xl p-6 space-y-5 max-w-xl">
      <Toggle
        label="Sound effects"
        desc="Ticks, reveals, correct/wrong"
        value={s.soundEffects}
        onChange={(v) => onUpdateSettings({ soundEffects: v })}
        icon={s.soundEffects ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      />
      <Toggle
        label="Hide MCQ options initially"
        desc="Reveal on demand"
        value={s.hideOptions}
        onChange={(v) => onUpdateSettings({ hideOptions: v })}
        icon={s.hideOptions ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      />
      <div className="flex items-center gap-4 py-2">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70"><Timer className="w-5 h-5" /></div>
        <div className="flex-1">
          <div className="font-medium">Timer seconds</div>
          <div className="text-sm text-white/50">Default per question</div>
        </div>
        <input
          type="number"
          value={s.timerSeconds}
          onChange={(e) => onUpdateSettings({ timerSeconds: Number(e.target.value) })}
          className="w-16 h-10 rounded bg-transparent border border-white/10 px-3 text-center"
        />
      </div>
      <div className="flex items-center gap-4 py-2">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70"><Sparkles className="w-5 h-5" /></div>
        <div className="flex-1">
          <div className="font-medium">Default marks</div>
          <div className="text-sm text-white/50">For new questions</div>
        </div>
        <input
          type="number"
          value={s.defaultMarks}
          onChange={(e) => onUpdateSettings({ defaultMarks: Number(e.target.value) })}
          className="w-16 h-10 rounded bg-transparent border border-white/10 px-3 text-center"
        />
      </div>
    </div>
  );
}

function Toggle({ label, desc, value, onChange, icon }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70">{icon}</div>
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-white/50">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-14 h-8 rounded-full transition relative ${value ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${value ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}

// --- shared bits --------------------------------------------------------

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50 transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-white/50 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
