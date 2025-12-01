export interface ResultRecord {
  id: string;
  sessionId?: string;
  timestamp: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  selectedFiles?: string[];
  folder?: string;
  userId?: string;
  results: Array<{
    questionId: number;
    selectedIndex: number | null;
    correctIndex: number;
    isCorrect: boolean;
  }>;
}

interface StoredData {
  schemaVersion: number;
  records: ResultRecord[];
}

const KEY = 'quiz_results';
const VERSION = 1;

function safeParse(json: string | null): StoredData {
  if (!json) return { schemaVersion: VERSION, records: [] };
  try {
    const obj = JSON.parse(json);
    if (!obj || !Array.isArray(obj.records)) return { schemaVersion: VERSION, records: [] };
    return { schemaVersion: obj.schemaVersion || VERSION, records: obj.records };
  } catch {
    return { schemaVersion: VERSION, records: [] };
  }
}

export function getAllStored(): StoredData {
  if (typeof window === 'undefined') return { schemaVersion: VERSION, records: [] };
  return safeParse(window.localStorage.getItem(KEY));
}

export function saveAll(data: StoredData): void {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify({ schemaVersion: VERSION, records: data.records });
  try {
    window.localStorage.setItem(KEY, payload);
  } catch (e) {
    // 容量不足時，移除最舊資料再嘗試一次
    const current = getAllStored();
    current.records = current.records.slice(Math.max(0, current.records.length - 100));
    window.localStorage.setItem(KEY, JSON.stringify(current));
  }
}

export function appendRecord(record: ResultRecord): void {
  const current = getAllStored();
  current.records.push(record);
  saveAll(current);
}

export function exportJSON(): string {
  const current = getAllStored();
  return JSON.stringify(current, null, 2);
}

export function importJSON(text: string): { added: number } {
  const incoming = safeParse(text);
  const current = getAllStored();
  const existingIds = new Set(current.records.map(r => r.id));
  const toAdd = incoming.records.filter(r => !existingIds.has(r.id));
  current.records.push(...toAdd);
  saveAll(current);
  return { added: toAdd.length };
}

