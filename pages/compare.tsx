import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { getUsers } from '../lib/users';
import { list as listManualScores } from '../lib/manualScores';
import TermSubjectChart from '../components/Report/TermSubjectChart';

export default function ComparePage() {
  const [users, setUsers] = useState([] as any[]);
  const [mounted, setMounted] = useState(false);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [term, setTerm] = useState<1|2|3|4|''>('');
  const [grade, setGrade] = useState<'高一'|'高二'|'高三'|''>('');

  useEffect(()=>{
    setUsers(getUsers());
    const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const ua = q.get('userA') || '';
    setA(ua);
    try {
      const allowFlag = typeof window !== 'undefined' ? window.sessionStorage.getItem('allow_compare') : null;
      const allowQuery = q.get('allow');
      if (!(allowFlag === '1' && allowQuery === '1')) {
        window.location.href = '/report';
        return;
      }
      window.sessionStorage.removeItem('allow_compare');
    } catch {}
    setMounted(true);
  },[]);

  const subjects = useMemo(() => {
    const recA = a ? listManualScores(a).find(r => r.term === term) : null;
    const recB = b ? listManualScores(b).find(r => r.term === term) : null;
    const sa = recA ? recA.entries.map(e => e.subject) : [];
    const sb = recB ? recB.entries.map(e => e.subject) : [];
    const set = new Set<string>([...sa, ...sb]);
    return Array.from(set);
  }, [a,b,term]);

  const series = useMemo(() => {
    const recA = a ? listManualScores(a).find(r => r.term === term) : null;
    const recB = b ? listManualScores(b).find(r => r.term === term) : null;
    const nameA = users.find(u => u.id === a)?.name || '姓名A';
    const nameB = users.find(u => u.id === b)?.name || '姓名B';
    const sA = subjects.map((label, idx) => {
      const v = recA?.entries.find(e => e.subject === label)?.score;
      return { x: idx, y: typeof v === 'number' ? v! : NaN };
    });
    const sB = subjects.map((label, idx) => {
      const v = recB?.entries.find(e => e.subject === label)?.score;
      return { x: idx, y: typeof v === 'number' ? v! : NaN };
    });
    return [
      { label: `${nameA} 第${term}學段`, points: sA },
      { label: `${nameB} 第${term}學段`, points: sB },
    ];
  }, [a,b,term,subjects,users]);

  return (
    <>
      <Head><title>分數比較</title></Head>
      <main className="min-h-screen bg-site py-6">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <h1 className="text-3xl font-extrabold text-gray-100">分數比較</h1>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-3" hidden={!mounted}>
            <span className="text-gray-200">姓名A</span>
            <select suppressHydrationWarning value={a} onChange={(e)=>setA(e.target.value)} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200">
              {users.map(u => (<option key={u.id} value={u.id}>{u.name}{u.group?`（${u.group}）`:''}{u.grade?` / ${u.grade}`:''}</option>))}
            </select>
            <span className="text-gray-200">姓名B</span>
            <select suppressHydrationWarning value={b} onChange={(e)=>setB(e.target.value)} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200">
              {users.map(u => (<option key={u.id} value={u.id}>{u.name}{u.group?`（${u.group}）`:''}{u.grade?` / ${u.grade}`:''}</option>))}
            </select>
            <span className="text-gray-200">年級</span>
            <select suppressHydrationWarning value={grade} onChange={(e)=>setGrade((e.target.value as any))} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200">
              <option value="高一">高一</option>
              <option value="高二">高二</option>
              <option value="高三">高三</option>
            </select>
            <span className="text-gray-200">學段</span>
            <select suppressHydrationWarning value={term} onChange={(e)=>setTerm((e.target.value ? Number(e.target.value) : '') as any)} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200">
              <option value="">未選</option>
              <option value={1}>第1學段</option>
              <option value={2}>第2學段</option>
              <option value={3}>第3學段</option>
              <option value={4}>第4學段</option>
            </select>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <TermSubjectChart series={series} subjects={subjects} />
          </div>
        </div>
      </main>
    </>
  );
}
