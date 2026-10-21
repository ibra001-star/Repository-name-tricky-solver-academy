// Minimal spreadsheet reader for the question import page.
// Reads .xlsx (a zip of XML files) using the browser's built-in
// DecompressionStream, and .csv. No third-party packages are needed.

export type SheetRow = Record<string, string>;

const decodeEntities = (s: string) =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

// ── zip ───────────────────────────────────────────────────────────────

const inflateRaw = async (data: Uint8Array): Promise<Uint8Array> => {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

export const readZip = async (buf: ArrayBuffer): Promise<Map<string, Uint8Array>> => {
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('This file is not a valid .xlsx workbook.');

  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const files = new Map<string, Uint8Array>();
  const decoder = new TextDecoder();

  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error('Corrupted workbook.');
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;

    if (!/\.(xml|rels)$/.test(name)) continue; // only the XML parts matter here
    const lhName = view.getUint16(localOffset + 26, true);
    const lhExtra = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + lhName + lhExtra;
    const raw = bytes.subarray(start, start + compSize);
    files.set(name, method === 0 ? raw : method === 8 ? await inflateRaw(raw) : new Uint8Array());
  }
  return files;
};

// ── xlsx ──────────────────────────────────────────────────────────────

const colIndex = (ref: string) => {
  const letters = ref.replace(/[^A-Z]/gi, '').toUpperCase();
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

const textOf = (xml: string) => {
  let out = '';
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += decodeEntities(m[1]);
  return out;
};

export const parseXlsxFiles = (files: Map<string, string>, preferredSheet = 'Questions'): SheetRow[] => {
  const shared: string[] = [];
  const sst = files.get('xl/sharedStrings.xml');
  if (sst) for (const m of sst.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)) shared.push(textOf(m[1]));

  // Find the sheet called "Questions" (or the first sheet).
  const workbook = files.get('xl/workbook.xml') ?? '';
  const rels = files.get('xl/_rels/workbook.xml.rels') ?? '';
  const sheets = [...workbook.matchAll(/<sheet\s[^>]*?>/g)].map((m) => {
    const tag = m[0];
    return {
      name: decodeEntities(/name="([^"]*)"/.exec(tag)?.[1] ?? ''),
      rid: /r:id="([^"]*)"/.exec(tag)?.[1] ?? '',
    };
  });
  const chosen = sheets.find((s) => s.name.toLowerCase() === preferredSheet.toLowerCase()) ?? sheets[0];
  let path = 'xl/worksheets/sheet1.xml';
  if (chosen) {
    const relTag = [...rels.matchAll(/<Relationship\s[^>]*?>/g)].map((m) => m[0]).find((t) => t.includes(`Id="${chosen.rid}"`));
    const target = relTag && /Target="([^"]*)"/.exec(relTag)?.[1];
    if (target) path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
  }
  const sheetXml = files.get(path);
  if (!sheetXml) throw new Error('Could not find the worksheet in this file.');

  const grid: string[][] = [];
  for (const rowMatch of sheetXml.matchAll(/<row\s[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const cells: string[] = [];
    for (const c of (rowMatch[1] ?? '').matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const inner = c[2] ?? '';
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1] ?? '';
      const type = /t="([^"]*)"/.exec(attrs)?.[1];
      let value = '';
      if (type === 's') value = shared[Number(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1])] ?? '';
      else if (type === 'inlineStr') value = textOf(inner);
      else value = decodeEntities(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '');
      cells[ref ? colIndex(ref) : cells.length] = value;
    }
    grid.push(cells);
  }
  return gridToRows(grid);
};

const gridToRows = (grid: string[][]): SheetRow[] => {
  if (grid.length === 0) return [];
  const header = Array.from(grid[0], (h) => (h ?? '').trim());
  const rows: SheetRow[] = [];
  for (const cells of grid.slice(1)) {
    const row: SheetRow = {};
    let any = false;
    header.forEach((h, i) => {
      if (!h) return;
      const v = cells[i] ?? '';
      if (v.trim() !== '') any = true;
      row[h] = v;
    });
    if (any) rows.push(row);
  }
  return rows;
};

// ── csv ───────────────────────────────────────────────────────────────

export const parseCsv = (text: string): SheetRow[] => {
  const src = text.replace(/^﻿/, '');
  const grid: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      grid.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    grid.push(row);
  }
  return gridToRows(grid);
};

// ── entry point ───────────────────────────────────────────────────────

export const readSpreadsheetFile = async (file: File): Promise<SheetRow[]> => {
  if (file.name.toLowerCase().endsWith('.csv')) return parseCsv(await file.text());
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Please choose an .xlsx or .csv file.');
  const zip = await readZip(await file.arrayBuffer());
  const dec = new TextDecoder();
  const texts = new Map<string, string>();
  zip.forEach((bytes, name) => texts.set(name, dec.decode(bytes)));
  return parseXlsxFiles(texts);
};
