import { useMemo, useState, useEffect } from 'react';
import { getActiveUserId, getUsers } from '../../lib/users';
import { get as getMS, upsert, saveAnalysis } from '../../lib/manualScores';
import SubjectScoresChart from './SubjectScoresChart';

type Grade = 'A+'|'A'|'A-'|'B+'|'B'|'B-'|'C+'|'C'|'C-'|'D';
interface SubjectSpec { id: string; name: string; required: boolean }
interface Entry { subject: string; input: string; note?: string; score?: number; grade?: Grade }
const REQUIRED = ['語文','數學','英文','公民','體育','電腦','餘暇活動'];
const OPTIONAL_BY_GROUP: Record<string, string[]> = {
  '智能科技班': ['AI','Python','機器人','科技閲讀','歷史','地理','物理','專業數學'],
  '偏理班': ['化學','物理','歷史','地理','美術','音樂'],
};

const GRADE_MAP: Record<Grade, number> = {
  'A+': 98,
  'A': 95,
  'A-': 92,
  'B+': 88,
  'B': 85,
  'B-': 82,
  'C+': 78,
  'C': 75,
  'C-': 72,
  'D': 65,
};

function parseScoreOrGrade(value: string): { score?: number; grade?: Grade } {
  const v = value.trim().toUpperCase();
  if ((['A+','A','A-','B+','B','B-','C+','C','C-','D'] as Grade[]).includes(v as Grade)) {
    const grade = v as Grade;
    return { grade, score: GRADE_MAP[grade] };
  }
  const num = Number(v);
  if (!isNaN(num)) {
    const score = Math.max(0, Math.min(100, Math.round(num * 10) / 10));
    return { score };
  }
  return {};
}

export default function ManualScoreAnalysis({ canEdit = false, userId: userIdProp }: { canEdit?: boolean; userId?: string }) {
  const [term, setTerm] = useState<1|2|3|4>(1);
  const [grade, setGrade] = useState<'高一'|'高二'|'高三'>('高一');
  const [userId, setUserId] = useState<string>('');
  const [subjectSpecs, setSubjectSpecs] = useState<SubjectSpec[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = userIdProp || '';
    setUserId(uid);
    const users = getUsers();
    const u = users.find(x => x.id === uid);
    const group = u?.group || '';
    const opts = group && OPTIONAL_BY_GROUP[group] ? OPTIONAL_BY_GROUP[group] : [];
    const optNames = opts.filter(n => !REQUIRED.includes(n));
    const specs: SubjectSpec[] = [];
    const seen = new Set<string>();
    REQUIRED.forEach(n => { if (!seen.has(n)) { specs.push({ id: n, name: n, required: true }); seen.add(n); } });
    optNames.forEach(n => { if (!seen.has(n)) { specs.push({ id: n, name: n, required: false }); seen.add(n); } });
    setSubjectSpecs(specs);
    const base: Entry[] = specs.map(s => ({ subject: s.name, input: '', note: '' }));
    setEntries(base);
  }, [userIdProp]);

  useEffect(() => {
    if (!userId) return;
    if (grade !== '高一') {
      setEntries(subjectSpecs.map(s => ({ subject: s.name, input: '', note: '' })));
      setAnalysis(null);
      return;
    }
    const rec = getMS(userId, term);
    if (rec) {
      setEntries(prev => prev.map(e => {
        const m = rec.entries.find(x => x.subject === e.subject);
        if (!m) return e;
        const inputVal = m.gradeOriginal ? m.gradeOriginal : (typeof m.score === 'number' ? String(m.score) : '');
        const parsed = parseScoreOrGrade(inputVal);
        return { ...e, input: inputVal, score: parsed.score, grade: parsed.grade, note: m.note };
      }));
      setAnalysis(rec.analysis || null);
    } else {
      setEntries(subjectSpecs.map(s => ({ subject: s.name, input: '', note: '' })));
      setAnalysis(null);
    }
  }, [userId, term, subjectSpecs.length, grade]);

  const onChangeInput = (idx: number, value: string) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const parsed = parseScoreOrGrade(value);
      return { ...e, input: value, score: parsed.score, grade: parsed.grade };
    }));
  };

  const onChangeNote = (idx: number, value: string) => {
    setEntries(prev => prev.map((e, i) => (i === idx ? { ...e, note: value } : e)));
  };

  const requiredMissing = useMemo(() => {
    const requiredSet = new Set(subjectSpecs.filter(s => s.required).map(s => s.name));
    return entries.filter(e => requiredSet.has(e.subject) && typeof e.score === 'undefined').map(e => e.subject);
  }, [entries, subjectSpecs]);

  const payload = useMemo(() => {
    return entries.map(e => {
      const item: any = { subject: e.subject, note: e.note };
      if (e.grade) item.gradeOriginal = e.grade;
      if (typeof e.score === 'number' && !e.grade) item.score = e.score;
      return item;
    });
  }, [entries]);

  const summary = useMemo(() => {
    const arr = entries.filter(e => typeof e.score === 'number' && !e.grade);
    const total = arr.reduce((s, e) => s + (e.score as number), 0);
    const count = arr.length;
    const avg = count ? Number(((total / count)).toFixed(2)) : 0;
    return { total, avg, count };
  }, [entries]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      if (requiredMissing.length > 0) {
        setError('必填科目未填：' + requiredMissing.join('、'));
        setLoading(false);
        return;
      }
      if (payload.length === 0) {
        setError('請至少輸入一個有效分數或等級');
        setLoading(false);
        return;
      }
      if (userId) upsert(userId, term, payload);
      const users = getUsers();
      const u = users.find(u => u.id === userId);
      const group = u?.group || '';
      const resp = await fetch('/api/analysis/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-DeepSeek-Key': (typeof window !== 'undefined' ? (window.localStorage.getItem('deepseek_api_key') || '') : '') },
        body: JSON.stringify({ manualScores: payload, term, classGroup: group, grade }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }
      const data = await resp.json();
      setAnalysis(data.analysis || '');
      setAnalysisOpen(false);
      if (userId) { saveAnalysis(userId, term, data.analysis || ''); try { window.dispatchEvent(new Event('manual_scores_updated')); } catch {} }
    } catch (e: any) {
      setError(e?.message || '分析失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-gray-100 mb-3">科目列表</h2>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-200">學期</span>
          <select value={term} onChange={(e)=>setTerm(Number(e.target.value) as any)} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200">
            <option value={1}>第一學段</option>
            <option value={2}>第二學段</option>
            <option value={3}>第三學段</option>
            <option value={4}>第四學段</option>
          </select>
          <span className="text-gray-200">年級</span>
          <select value={grade} onChange={(e)=>setGrade(e.target.value as any)} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200">
            <option value="高一">高一</option>
            <option value="高二">高二</option>
            <option value="高三">高三</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
        <button onClick={()=>{ if (userId && grade==='高一') { upsert(userId, term, payload); try { window.dispatchEvent(new Event('manual_scores_updated')); } catch {} } }} className="px-3 py-2 bg-green-600 text-white rounded-lg transition-transform duration-200 ease-out hover:scale-[1.03]" disabled={!canEdit || grade!=='高一'}>保存</button>
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-100 mb-2">必修科目</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.filter(e => REQUIRED.includes(e.subject)).map((e, idxAll) => {
          const idx = entries.findIndex(x => x.subject === e.subject);
          const parsed = parseScoreOrGrade(e.input);
          const valid = typeof parsed.score !== 'undefined';
          return (
            <div key={e.subject} className={`rounded-xl border ${valid ? 'border-gray-600' : 'border-rose-600'} bg-gray-900/40 p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-100 font-semibold">{e.subject}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-900/40 text-rose-300 border border-rose-700">必修</span>
              </div>
              <div className="flex gap-3 items-center">
                <input value={e.input} onChange={(ev)=>onChangeInput(idx, ev.target.value)} placeholder="分數或等級（如 88.5 或 A-）" className="flex-1 p-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200" disabled={!canEdit} />
                <span className="text-sm text-gray-300 min-w-[80px] text-center">{typeof parsed.score !== 'undefined' ? `${parsed.score}` : '未填'}</span>
              </div>
              <div className="mt-2">
                <input value={e.note || ''} onChange={(ev)=>onChangeNote(idx, ev.target.value)} placeholder="備註（選填）" className="w-full p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-300" disabled={!canEdit} />
              </div>
            </div>
          );
        })}
      </div>
      {subjectSpecs.some(s=>!s.required) && (
        <>
          <h3 className="text-lg font-bold text-gray-100 mt-6 mb-2">選修科目</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.filter(e => !REQUIRED.includes(e.subject)).map((e) => {
              const idx = entries.findIndex(x => x.subject === e.subject);
              const parsed = parseScoreOrGrade(e.input);
              const valid = typeof parsed.score !== 'undefined';
              return (
                <div key={e.subject} className={`rounded-xl border ${valid ? 'border-gray-600' : 'border-gray-700'} bg-gray-900/40 p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-100 font-semibold">{e.subject}</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <input value={e.input} onChange={(ev)=>onChangeInput(idx, ev.target.value)} placeholder="分數或等級（如 88.5 或 A-）" className="flex-1 p-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200" disabled={!canEdit} />
                    <span className="text-sm text-gray-300 min-w-[80px] text-center">{typeof parsed.score !== 'undefined' ? `${parsed.score}` : '未填'}</span>
                  </div>
                  <div className="mt-2">
                    <input value={e.note || ''} onChange={(ev)=>onChangeNote(idx, ev.target.value)} placeholder="備註（選填）" className="w-full p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-300" disabled={!canEdit} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex items-center gap-3">
        <button onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg" disabled={loading || !canEdit || grade!=='高一'}>
          {loading ? '分析中...' : 'AI 分析'}
        </button>
          {requiredMissing.length > 0 && (
            <span className="text-sm text-rose-300">必填未完成：{requiredMissing.join('、')}</span>
          )}
        </div>
        <div className="ml-auto">
          {analysis && (
            <button onClick={()=>setAnalysisOpen(v=>!v)} className="px-3 py-2 bg-gray-700 text-gray-200 rounded-lg border border-gray-600 transition-transform duration-200 ease-out hover:scale-[1.03]">{analysisOpen ? '收起 AI 分析' : '查看 AI 分析'}</button>
          )}
        </div>
      </div>
      {error && <div className="mt-3 text-rose-300">{error}</div>}
      {analysisOpen && analysis && (()=>{
        const formatted = analysis
          .replace(/^\s*[*-]\s+/gm, '• ')
          .replace(/\*\*(.*?)\*\*/g, '$1');
        return (
          <div className="mt-3 bg-gray-900 rounded-lg p-4 border border-gray-700 text-gray-200 whitespace-pre-wrap transition-all duration-300 ease-out">{formatted}</div>
        );
      })()}

      <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-gray-100 mb-3">科目分數折綫圖（當前學段）</h3>
        <SubjectScoresChart data={entries.filter(e => typeof e.score === 'number').map(e => ({ label: e.subject, score: e.score as number }))} />
        <div className="mt-3 text-gray-200">
          <span className="mr-4">總分：{summary.total}</span>
          <span>平均分：{summary.avg}</span>
        </div>
        {(() => {
          const included = entries.filter(e => typeof e.score === 'number' && !e.grade);
          return (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-400">查看計算明細</summary>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300 text-sm">
                {included.map(e => (
                  <div key={`sum-${e.subject}`} className="flex items-center justify-between bg-gray-900/40 rounded border border-gray-700 px-3 py-1">
                    <span>{e.subject}</span>
                    <span>{(e.score as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </details>
          );
        })()}
      </div>
    </div>
  );
}

