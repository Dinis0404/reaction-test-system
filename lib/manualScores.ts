export type Term = 1 | 2 | 3 | 4;
export interface ManualScoreEntry { subject: string; score?: number; gradeOriginal?: string; note?: string }
export interface ManualScoreRecord { id: string; userId: string; term: Term; entries: ManualScoreEntry[]; analysis?: string; updatedAt: number }

const KEY = 'manual_scores';

function safeParse(json: string | null): ManualScoreRecord[] { try { return json ? JSON.parse(json) : [] } catch { return [] } }

export function list(userId?: string): ManualScoreRecord[] {
  if (typeof window === 'undefined') return [];
  const all = safeParse(window.localStorage.getItem(KEY));
  return userId ? all.filter(r => r.userId === userId) : all;
}

export function get(userId: string, term: Term): ManualScoreRecord | null {
  const rec = list(userId).find(r => r.term === term);
  return rec || null;
}

export function upsert(userId: string, term: Term, entries: ManualScoreEntry[]): ManualScoreRecord {
  const all = list();
  const id = `ms_${userId}_${term}`;
  const now = Date.now();
  const existingIdx = all.findIndex(r => r.id === id);
  const record: ManualScoreRecord = { id, userId, term, entries, updatedAt: now };
  if (existingIdx >= 0) all[existingIdx] = { ...all[existingIdx], ...record };
  else all.push(record);
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(all));
  return record;
}

export function saveAnalysis(userId: string, term: Term, analysis: string) {
  const all = list();
  const id = `ms_${userId}_${term}`;
  const idx = all.findIndex(r => r.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], analysis, updatedAt: Date.now() };
  } else {
    all.push({ id, userId, term, entries: [], analysis, updatedAt: Date.now() });
  }
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(all));
}
