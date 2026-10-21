import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { matchKey, parseImportRow } from '../utils/questionImport';

export interface ImportRowResult {
  row: number; // spreadsheet row number (header is row 1)
  status: 'ready' | 'error' | 'duplicate';
  errors: string[];
  summary?: { subject: string; topic: string; type: string; marks: number; text: string };
}

export const importQuestions = async (
  rows: Record<string, unknown>[],
  dryRun: boolean,
  author: { id: string; role: Role }
) => {
  const subjects = await prisma.subject.findMany({ include: { topics: true } });
  const isAdmin = author.role === 'ADMIN' || author.role === 'SUPER_ADMIN';

  const results: ImportRowResult[] = [];
  const toCreate: Prisma.QuestionCreateManyInput[] = [];
  const seenInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    const parsed = parseImportRow(rows[i]);
    if (!parsed.data) {
      results.push({ row: rowNumber, status: 'error', errors: parsed.errors });
      continue;
    }
    const d = parsed.data;

    const subject = subjects.find((s) => matchKey(s.name) === matchKey(d.subject) || s.slug === matchKey(d.subject));
    if (!subject) {
      const names = subjects.map((s) => s.name).join(', ');
      results.push({ row: rowNumber, status: 'error', errors: [`subject "${d.subject}" not found (available: ${names})`] });
      continue;
    }
    const topic = subject.topics.find((t) => matchKey(t.name) === matchKey(d.topic) || t.slug === matchKey(d.topic));
    if (!topic) {
      const names = subject.topics.map((t) => t.name).join(', ');
      results.push({ row: rowNumber, status: 'error', errors: [`topic "${d.topic}" not found in ${subject.name} (available: ${names})`] });
      continue;
    }

    const summary = { subject: subject.name, topic: topic.name, type: d.type, marks: d.marks, text: d.content.text.slice(0, 120) };
    const dupKey = `${subject.id}|${matchKey(d.content.text)}`;
    const existing = await prisma.question.findFirst({
      where: { subjectId: subject.id, content: { path: ['text'], equals: d.content.text } },
      select: { id: true },
    });
    if (existing || seenInBatch.has(dupKey)) {
      results.push({ row: rowNumber, status: 'duplicate', errors: ['this question is already in the bank'], summary });
      continue;
    }
    seenInBatch.add(dupKey);

    results.push({ row: rowNumber, status: 'ready', errors: [], summary });
    toCreate.push({
      subjectId: subject.id,
      topicId: topic.id,
      type: d.type,
      difficulty: d.difficulty,
      curriculum: d.curriculum,
      form: d.form,
      year: d.year,
      publisher: d.publisher,
      tags: d.tags,
      marks: d.marks,
      content: d.content as Prisma.InputJsonValue,
      solution: d.solution as Prisma.InputJsonValue,
      authorId: author.id,
      isApproved: isAdmin,
    });
  }

  let created = 0;
  if (!dryRun && toCreate.length > 0) {
    const res = await prisma.question.createMany({ data: toCreate });
    created = res.count;
  }

  return {
    dryRun,
    total: rows.length,
    ready: results.filter((r) => r.status === 'ready').length,
    duplicates: results.filter((r) => r.status === 'duplicate').length,
    errors: results.filter((r) => r.status === 'error').length,
    created,
    results,
  };
};
