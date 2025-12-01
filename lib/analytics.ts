import { appendRecord, ResultRecord } from './storage';

export interface Summary {
  score: number;
  correctCount: number;
  totalQuestions: number;
}

export function saveResult(
  summary: Summary,
  results: Array<{ questionId: number; selectedIndex: number | null; correctIndex: number; isCorrect: boolean }>,
  context?: { sessionId?: string; selectedFiles?: string[]; folder?: string; userId?: string }
): ResultRecord {
  const id = `result_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record: ResultRecord = {
    id,
    sessionId: context?.sessionId,
    timestamp: Date.now(),
    score: summary.score,
    correctCount: summary.correctCount,
    totalQuestions: summary.totalQuestions,
    selectedFiles: context?.selectedFiles,
    folder: context?.folder,
    userId: context?.userId,
    results,
  };
  appendRecord(record);
  return record;
}

export function getAllResults(): ResultRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('quiz_results');
    if (!raw) return [];
    const obj = JSON.parse(raw);
    return obj?.records || [];
  } catch {
    return [];
  }
}

export function computeOverview(records: ResultRecord[]) {
  const count = records.length;
  const avg = count ? Math.round(records.reduce((s, r) => s + r.score, 0) / count) : 0;
  const latest = records.sort((a, b) => b.timestamp - a.timestamp)[0] || null;
  return { averageScore: avg, attempts: count, latestScore: latest?.score ?? null };
}

export function computeTrend(records: ResultRecord[], limit = 20) {
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const sliced = sorted.slice(Math.max(0, sorted.length - limit));
  return sliced.map(r => ({ t: r.timestamp, score: r.score }));
}

export function computeByCategory(records: ResultRecord[]) {
  const groups: Record<string, { count: number; sum: number }> = {};
  records.forEach(r => {
    const key = r.folder || 'unknown';
    groups[key] = groups[key] || { count: 0, sum: 0 };
    groups[key].count++;
    groups[key].sum += r.score;
  });
  return Object.entries(groups).map(([k, v]) => ({ category: k, average: Math.round(v.sum / v.count), attempts: v.count }));
}

export function computeWrongTop(records: ResultRecord[], limit = 20) {
  const freq: Map<number, number> = new Map();
  records.forEach(r => {
    r.results.forEach(it => {
      if (!it.isCorrect) freq.set(it.questionId, (freq.get(it.questionId) || 0) + 1);
    });
  });
  const list = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([questionId, times]) => ({ questionId, times }));
  return list;
}

