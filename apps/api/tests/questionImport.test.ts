import { describe, it, expect } from 'vitest';
import { parseImportRow } from '../src/utils/questionImport';

const base = {
  subject: 'Mathematics', topic: 'Algebra', difficulty: 'easy', type: 'calculation', marks: '3',
  year: 2025, curriculum: 'KCSE', tags: 'Kcse-2025, paper-2', question: 'Find $x$.',
  steps: 'Step one\nStep two\n', final_answer: '$x = 5$',
};

describe('parseImportRow', () => {
  it('parses a valid written question', () => {
    const r = parseImportRow(base);
    expect(r.errors).toEqual([]);
    expect(r.data?.type).toBe('CALCULATION');
    expect(r.data?.difficulty).toBe('EASY');
    expect(r.data?.marks).toBe(3);
    expect(r.data?.tags).toEqual(['kcse-2025', 'paper-2']);
    expect(r.data?.solution.steps).toEqual(['Step one', 'Step two']);
  });

  it('accepts messy headers and a "Form 3" value', () => {
    const r = parseImportRow({ ...base, Form: 'Form 3', 'Marking Note': 'B1' });
    expect(r.data?.form).toBe(3);
  });

  it('reports missing fields', () => {
    const r = parseImportRow({ subject: 'Mathematics' });
    expect(r.data).toBeUndefined();
    expect(r.errors.length).toBeGreaterThan(3);
  });

  it('builds multiple choice options and defaults the final answer', () => {
    const r = parseImportRow({
      ...base, type: 'Multiple Choice', final_answer: '',
      option_a: '1', option_b: '2', option_c: '3', correct_option: 'b',
    });
    expect(r.errors).toEqual([]);
    expect(r.data?.content.options?.map((o) => o.isCorrect)).toEqual([false, true, false]);
    expect(r.data?.solution.finalAnswer).toBe('2');
  });

  it('rejects multiple choice without a valid correct option', () => {
    const r = parseImportRow({ ...base, type: 'MULTIPLE_CHOICE', option_a: '1', option_b: '2', correct_option: 'D' });
    expect(r.errors.join(' ')).toMatch(/no matching option/);
  });

  it('rejects a bad type and out-of-range marks', () => {
    const r = parseImportRow({ ...base, type: 'poem', marks: 500 });
    expect(r.errors.join(' ')).toMatch(/type/);
    expect(r.errors.join(' ')).toMatch(/marks/);
  });
});
