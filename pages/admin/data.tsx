import { useEffect, useState } from 'react';

function safeParse<T>(text: string | null, fallback: T): T {
  if (!text) return fallback;
  try { return JSON.parse(text) as T } catch { return fallback }
}

export default function AdminDataPage() {
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const flag = typeof window !== 'undefined' ? window.sessionStorage.getItem('admin_authed') : null;
    setAuthed(flag === '1');
    try {
      const manual = safeParse(window.localStorage.getItem('manual_scores'), [] as any[]);
      const results = safeParse(window.localStorage.getItem('quiz_results'), { schemaVersion: 1, records: [] } as any);
      const users = safeParse(window.localStorage.getItem('quiz_users'), [] as any[]);
      const active = window.localStorage.getItem('quiz_active_user') || '';
      const deepseek = window.localStorage.getItem('deepseek_api_key') || '';
      const combined = { manual_scores: manual, quiz_results: results, quiz_users: users, quiz_active_user: active, deepseek_api_key: deepseek };
      setContent(JSON.stringify(combined, null, 2));
    } catch {}
  }, []);

  const onFormat = () => {
    try {
      const obj = JSON.parse(content);
      setContent(JSON.stringify(obj, null, 2));
      setStatus('已格式化');
    } catch (e: any) {
      setStatus('JSON 格式錯誤');
    }
  };

  const onValidate = () => {
    try {
      JSON.parse(content);
      setStatus('格式有效');
    } catch (e: any) {
      setStatus('JSON 格式錯誤');
    }
  };

  const onSave = () => {
    try {
      const obj = JSON.parse(content);
      if (typeof window !== 'undefined') {
        if (obj && obj.manual_scores) window.localStorage.setItem('manual_scores', JSON.stringify(obj.manual_scores));
        if (obj && obj.quiz_results) window.localStorage.setItem('quiz_results', JSON.stringify(obj.quiz_results));
        if (obj && obj.quiz_users) window.localStorage.setItem('quiz_users', JSON.stringify(obj.quiz_users));
        if (obj && typeof obj.quiz_active_user === 'string') window.localStorage.setItem('quiz_active_user', obj.quiz_active_user);
        if (obj && typeof obj.deepseek_api_key === 'string') window.localStorage.setItem('deepseek_api_key', obj.deepseek_api_key);
      }
      setStatus('已保存');
    } catch (e: any) {
      setStatus('保存失敗');
    }
  };

  return (
    <main className="min-h-screen bg-site py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-100">數據總覽與編輯</h1>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700" hidden={!mounted || authed}>
          <h3 className="text-lg font-bold text-gray-100 mb-3">管理員登入</h3>
          <div className="flex gap-3 items-center">
            <input type="password" value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="密碼" className="flex-1 p-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200" />
            <button onClick={()=>{ if (pin === '04041223') { setAuthed(true); setLoginError(null); setPin(''); try { window.sessionStorage.setItem('admin_authed','1'); } catch{} } else { setLoginError('密碼錯誤'); } }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">登入</button>
          </div>
          {loginError && (<div className="mt-2 text-rose-300 text-sm">{loginError}</div>)}
        </div>

        {authed && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div className="text-lg font-bold text-gray-100">站點資料（單文件）</div>
              <div className="flex gap-2">
                <button onClick={onFormat} className="px-3 py-2 bg-gray-700 text-gray-200 rounded-lg">格式化</button>
                <button onClick={onValidate} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">校驗</button>
                <button onClick={onSave} className="px-3 py-2 bg-green-600 text-white rounded-lg">保存</button>
              </div>
            </div>
            <div className="p-6">
              <textarea value={content} onChange={(e)=>setContent(e.target.value)} className="w-full h-[520px] p-4 rounded-lg border-2 border-gray-700 bg-gray-900 text-gray-200 font-mono text-sm leading-6" />
              {status && <div className="mt-3 text-sm text-gray-300">{status}</div>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

