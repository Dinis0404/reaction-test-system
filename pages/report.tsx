import Head from 'next/head';
import { getAllResults, computeOverview, computeTrend } from '../lib/analytics';
import { getUsers } from '../lib/users';
import TrendChart from '../components/Report/TrendChart';
import TermSubjectChart from '../components/Report/TermSubjectChart';
import ManualScoreAnalysis from '../components/Report/ManualScoreAnalysis';
import ManualTrendChart from '../components/Report/ManualTrendChart';
import { list as listManualScores } from '../lib/manualScores';

import { useMemo, useEffect, useState } from 'react';

export default function ReportPage() {
  const [users, setUsers] = useState([] as any[]);
  const [active, setActive] = useState<string>('');
  const [records, setRecords] = useState([] as any[]);
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  useEffect(() => {
    setUsers(getUsers());
    setActive('');
    setRecords(getAllResults());
    setAuthed(false);
  }, []);
  const [manualVersion, setManualVersion] = useState(0);
  useEffect(() => {
    const onUpdate = () => setManualVersion(v => v + 1);
    window.addEventListener('manual_scores_updated', onUpdate);
    return () => window.removeEventListener('manual_scores_updated', onUpdate);
  }, []);
  const filtered = useMemo(() => records.filter((r: any) => (active ? r.userId === active : true)), [records, active]);
  const overview = computeOverview(filtered);
  const trend = computeTrend(filtered, 20);
  const subjectLabels = useMemo(() => {
    if (!active) return [] as string[];
    const recs = listManualScores(active).slice();
    return Array.from(new Set(recs.flatMap(r => r.entries.map(e => e.subject))));
  }, [active, manualVersion]);
  const termSeries = useMemo(() => {
    if (!active) return [] as Array<{ label: string; points: { x: number; y: number }[] }>;
    const recs = listManualScores(active).slice().sort((a,b)=>a.term-b.term);
    const gradeMap: Record<string, number> = { 'A+': 98, 'A': 95, 'A-': 92, 'B+': 88, 'B': 85, 'B-': 82, 'C+': 78, 'C': 75, 'C-': 72, 'D': 65 };
    return [1,2,3,4]
      .map(t => {
        const record = recs.find(r => r.term === t);
        const hasData = !!record && record.entries.some(e => typeof e.score === 'number' || !!e.gradeOriginal);
        if (!hasData) return null;
        const points = subjectLabels.map((label, idx) => {
          const found = record?.entries.find(e => e.subject === label);
          let val = 0;
          if (typeof found?.score === 'number') {
            val = found!.score!;
          } else if (found?.gradeOriginal) {
            const g = String(found.gradeOriginal).trim().toUpperCase();
            val = gradeMap[g] ?? 0;
          }
          return { x: idx, y: val };
        });
        return { label: `第${t}學段`, points };
      })
      .filter((s): s is { label: string; points: { x: number; y: number }[] } => !!s);
  }, [active, manualVersion, subjectLabels]);

  const latestSummary = useMemo(() => {
    if (!active) return { total: 0, avg: 0 };
    const recs = listManualScores(active);
    const latest = recs.length ? [...recs].sort((a:any,b:any)=>b.term-a.term)[0] : null;
    const arr = latest ? latest.entries.filter((e:any)=> typeof e.score === 'number' && !e.gradeOriginal) : [];
    const total = arr.reduce((s:number, e:any)=> s + (e.score as number), 0);
    const count = arr.length;
    const avg = count ? Number(((total / count)).toFixed(2)) : 0;
    return { total, avg };
  }, [active, manualVersion]);
 

  return (
    <>
      <Head>
        <title>成績分析</title>
      </Head>
      <main className="min-h-screen bg-site py-6 transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <h1 className="text-3xl font-extrabold text-gray-100">成績分析</h1>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-3">
            <span className="text-gray-200">姓名</span>
            <select suppressHydrationWarning value={active} onChange={(e)=>{ const id=e.target.value||''; setActive(id); }} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200" disabled={!authed}>
              <option value=""></option>
              {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
            {(() => {
              const g = users.find(u => u.id === active)?.group;
              return g ? (
                <span className={`ml-2 px-2 py-1 rounded-full border ${g==='智能科技班'?'bg-blue-900/40 text-blue-300 border-blue-700':'bg-emerald-900/40 text-emerald-300 border-emerald-700'}`}>{g}</span>
              ) : null;
            })()}
            {authed && !!active && (
              <a
                href={`/compare?userA=${active}&allow=1`}
                onClick={() => { try { window.sessionStorage.setItem('allow_compare','1'); } catch {} }}
                className="ml-auto px-3 py-2 bg-purple-600 text-white rounded-lg"
              >比較</a>
            )}
            {!authed ? (
              <button onClick={()=>setShowLogin(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg">登入</button>
            ) : (
              <span className="px-3 py-1 text-sm rounded-lg bg-green-700 border border-green-600 text-white">已登入</span>
            )}
          </div>
          {loginError && (<div className="text-rose-300 text-sm">{loginError}</div>)}

          {showLogin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
              <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold text-gray-100 mb-3">登入</h3>
                <input type="password" value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="密碼" className="w-full p-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200" />
                {loginError && (<div className="mt-2 text-rose-300 text-sm">{loginError}</div>)}
                <div className="mt-4 flex gap-2 justify-end">
                  <button onClick={()=>setShowLogin(false)} className="px-3 py-2 bg-gray-700 text-gray-200 rounded-lg">取消</button>
                  <button onClick={()=>{ if (pin === '20070125') { setAuthed(true); setLoginError(null); setShowLogin(false); setPin(''); } else { setLoginError('密碼錯誤'); } }} className="px-3 py-2 bg-blue-600 text-white rounded-lg">確認</button>
                </div>
              </div>
            </div>
          )}
          {authed && !!active && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                <div className="text-4xl font-bold text-blue-400">{latestSummary.total}</div>
                <div className="text-sm text-gray-300">總分</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                <div className="text-4xl font-bold text-blue-400">{latestSummary.avg}</div>
                <div className="text-sm text-gray-300">平均分</div>
              </div>
            </div>
          )}

          {authed && !!active && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-gray-100 mb-3">分數折綫圖</h2>
              <TermSubjectChart series={termSeries} subjects={subjectLabels} />
            </div>
          )}

          {authed && !!active && (<ManualScoreAnalysis canEdit={authed && !!active} userId={active} />)}

          
        </div>
      </main>
    </>
  );
}

