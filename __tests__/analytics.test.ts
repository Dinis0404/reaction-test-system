import { computeOverview, computeTrend, computeByCategory, computeWrongTop } from '../lib/analytics';

const sample = [
  { id: 'a', timestamp: 1, score: 80, correctCount: 8, totalQuestions: 10, folder: 'english', results: [{ questionId: 1, selectedIndex: 0, correctIndex: 0, isCorrect: true }] },
  { id: 'b', timestamp: 2, score: 60, correctCount: 6, totalQuestions: 10, folder: 'math', results: [{ questionId: 2, selectedIndex: 1, correctIndex: 2, isCorrect: false }] },
  { id: 'c', timestamp: 3, score: 90, correctCount: 9, totalQuestions: 10, folder: 'english', results: [{ questionId: 3, selectedIndex: 0, correctIndex: 0, isCorrect: true }] },
] as any;

function expectEqual(a: any, b: any, msg: string) {
  const jA = JSON.stringify(a);
  const jB = JSON.stringify(b);
  if (jA !== jB) throw new Error(`Assertion failed: ${msg}.\nExpected: ${jB}\nActual:   ${jA}`);
}

// Overview
const ov = computeOverview(sample);
expectEqual(ov.averageScore, 77, 'average score');
expectEqual(ov.attempts, 3, 'attempts count');
expectEqual(ov.latestScore, 90, 'latest score');

// Trend
const tr = computeTrend(sample, 20);
expectEqual(tr.length, 3, 'trend length');
expectEqual(tr[2].score, 90, 'trend last score');

// Category
const cats = computeByCategory(sample);
const english = cats.find(c => c.category === 'english');
if (!english) throw new Error('missing english category');
expectEqual(english.average, 85, 'english avg');

// Wrong top
const wrong = computeWrongTop(sample);
expectEqual(wrong[0].questionId, 2, 'top wrong question');

console.log('analytics tests passed');

