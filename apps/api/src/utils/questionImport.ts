// Pure helpers that turn one spreadsheet row into a validated question.
// Kept free of database code so they are easy to unit test.

export const QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'STRUCTURED',
  'FILL_IN_BLANK',
  'MATCHING',
  'ESSAY',
  'CALCULATION',
  'GRAPH',
  'IMAGE_BASED',
] as const;
export type ImportQuestionType = (typeof QUESTION_TYPES)[number];

export interface ParsedImportRow {
  subject: string;
  topic: string;
  type: ImportQuestionType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  curriculum: 'CBC' | 'KCSE';
  form?: number;
  year?: number;
  publisher?: string;
  tags: string[];
  marks: number;
  content: {
    text: string;
    latex?: string;
    options?: { id: string; text: string; isCorrect: boolean }[];
  };
  solution: {
    steps: string[];
    finalAnswer: string;
    markingScheme?: string;
  };
}

const str = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\r\n?/g, '\n').trim();
};

const intOf = (v: unknown): number | undefined => {
  const s = str(v);
  if (!s) return undefined;
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : undefined;
};

export const normaliseKey = (key: string) =>
  key.trim().toLowerCase().replace(/[\s-]+/g, '_');

export const normaliseRow = (raw: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) out[normaliseKey(k)] = v;
  return out;
};

export const parseImportRow = (
  rawRow: Record<string, unknown>
): { errors: string[]; data?: ParsedImportRow } => {
  const raw = normaliseRow(rawRow);
  const errors: string[] = [];

  const subject = str(raw.subject);
  const topic = str(raw.topic);
  if (!subject) errors.push('subject is missing');
  if (!topic) errors.push('topic is missing');

  const typeText = str(raw.type).toUpperCase().replace(/[\s-]+/g, '_');
  const type = QUESTION_TYPES.find((t) => t === typeText);
  if (!type) errors.push(`type "${str(raw.type)}" is not valid (use ${QUESTION_TYPES.join(', ')})`);

  const diffText = str(raw.difficulty).toUpperCase() || 'MEDIUM';
  if (!['EASY', 'MEDIUM', 'HARD'].includes(diffText)) errors.push(`difficulty "${diffText}" must be EASY, MEDIUM or HARD`);

  const curText = str(raw.curriculum).toUpperCase() || 'KCSE';
  if (!['CBC', 'KCSE'].includes(curText)) errors.push(`curriculum "${curText}" must be CBC or KCSE`);

  const marks = intOf(raw.marks) ?? 1;
  if (marks < 1 || marks > 100) errors.push('marks must be between 1 and 100');

  const form = intOf(raw.form);
  if (form !== undefined && (form < 1 || form > 4)) errors.push('form must be 1 to 4');

  const year = intOf(raw.year);
  if (year !== undefined && (year < 1990 || year > 2100)) errors.push('year must be between 1990 and 2100');

  const text = str(raw.question);
  if (!text) errors.push('question text is missing');

  const steps = str(raw.steps)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  let finalAnswer = str(raw.final_answer);

  let options: { id: string; text: string; isCorrect: boolean }[] | undefined;
  if (type === 'MULTIPLE_CHOICE') {
    const letters = ['A', 'B', 'C', 'D'];
    const filled = letters
      .map((l) => ({ id: l, text: str(raw[`option_${l.toLowerCase()}`]) }))
      .filter((o) => o.text);
    const correct = str(raw.correct_option).toUpperCase().replace(/[^A-D]/g, '').slice(0, 1);
    if (filled.length < 2) errors.push('multiple choice needs at least two options');
    else if (!correct) errors.push('correct_option is missing (A, B, C or D)');
    else if (!filled.some((o) => o.id === correct)) errors.push(`correct_option ${correct} has no matching option text`);
    options = filled.map((o) => ({ ...o, isCorrect: o.id === correct }));
    if (!finalAnswer) finalAnswer = filled.find((o) => o.id === correct)?.text ?? '';
  }

  if (!finalAnswer) errors.push('final_answer is missing');

  if (errors.length > 0 || !type) return { errors };

  const latex = str(raw.latex);
  const note = str(raw.marking_note);
  const tags = str(raw.tags)
    .split(/[,;]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return {
    errors: [],
    data: {
      subject,
      topic,
      type,
      difficulty: diffText as ParsedImportRow['difficulty'],
      curriculum: curText as ParsedImportRow['curriculum'],
      form,
      year,
      publisher: str(raw.publisher) || undefined,
      tags,
      marks,
      content: { text, ...(latex ? { latex } : {}), ...(options ? { options } : {}) },
      solution: { steps, finalAnswer, ...(note ? { markingScheme: note } : {}) },
    },
  };
};

// Case/space-insensitive key for matching names and detecting repeated text.
export const matchKey = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
