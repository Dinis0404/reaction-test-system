import { useEffect, useState } from 'react';
import { getUsers, addUser, deleteUser, getActiveUserId, setActiveUserId, setUserGroup, setUserGrade } from '../../lib/users';

export default function UsersAdminPage() {
  const [users, setUsers] = useState([] as any[]);
  const [name, setName] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [manualJSON, setManualJSON] = useState('');
  const [resultsJSON, setResultsJSON] = useState('');
  const [deepseek, setDeepseek] = useState('');

  useEffect(() => { 
    setUsers(getUsers());
    setActive(getActiveUserId()); 
    setAuthed(false);
    try { window.sessionStorage.removeItem('admin_authed'); } catch {}
    setMounted(true);
    try {
      setManualJSON(window.localStorage.getItem('manual_scores') || '');
      setResultsJSON(window.localStorage.getItem('quiz_results') || '');
      setDeepseek(window.localStorage.getItem('deepseek_api_key') || '');
    } catch {}
  }, []);

  const onAdd = () => {
    if (!name.trim()) return;
    addUser(name.trim());
    setUsers(getUsers());
    setName('');
  };

  const onDelete = (id: string) => {
    deleteUser(id);
    setUsers(getUsers());
    if (active === id) setActive(getActiveUserId());
  };

  const onSetActive = (id: string) => {
    setActiveUserId(id);
    setActive(id);
  };

  return (
    <main className="min-h-screen bg-site py-6">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <h1 className="text-2xl font-extrabold text-gray-100">使用者管理</h1>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700" hidden={!mounted || authed}>
            <h3 className="text-lg font-bold text-gray-100 mb-3">管理員登入</h3>
            <div className="flex gap-3 items-center">
              <input type="password" value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="密碼" className="flex-1 p-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200" />
              <button onClick={()=>{ if (pin === '04041223') { setAuthed(true); setLoginError(null); setPin(''); try { window.sessionStorage.setItem('admin_authed','1'); } catch{} } else { setLoginError('密碼錯誤'); } }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">登入</button>
            </div>
            {loginError && (<div className="mt-2 text-rose-300 text-sm">{loginError}</div>)}
        </div>
        {authed && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="新增使用者名稱" className="flex-1 p-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200" />
              <button onClick={onAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg">新增</button>
            </div>
          </div>
        )}
        {authed && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold text-gray-100 mb-3">DeepSeek API Key</h2>
            <div className="flex gap-3">
              <input type="password" value={deepseek} onChange={(e)=>setDeepseek(e.target.value)} placeholder="填入密鑰" className="flex-1 p-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200" />
              <button onClick={()=>{ try { window.localStorage.setItem('deepseek_api_key', deepseek || ''); alert('已保存 API Key'); } catch(e:any){ alert('保存失敗: '+(e?.message||'未知')); } }} className="px-4 py-2 bg-green-600 text-white rounded-lg">保存</button>
            </div>
          </div>
        )}
        {authed && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold text-gray-100 mb-3">使用者列表</h2>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-gray-900/40 rounded-lg p-3 border border-gray-700">
                  <div className="text-gray-200">{u.name}</div>
                  <div className="flex gap-2 items-center">
                  <select value={u.group || ''} onChange={(e)=>{ setUserGroup(u.id, (e.target.value as any)); setUsers(getUsers()); }} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200">
                    <option value="">未分類</option>
                    <option value="智能科技班">智能科技班</option>
                    <option value="偏理班">偏理班</option>
                  </select>
                  <select value={u.grade || ''} onChange={(e)=>{ setUserGrade(u.id, (e.target.value as any)); setUsers(getUsers()); }} className="p-2 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-200">
                    <option value="">未設年級</option>
                    <option value="高一">高一</option>
                    <option value="高二">高二</option>
                    <option value="高三">高三</option>
                  </select>
                  <button onClick={() => onSetActive(u.id)} className={`px-3 py-1 rounded ${active===u.id?'bg-green-600 text-white':'bg-gray-700 text-gray-200'}`}>{active===u.id?'當前使用者':'設為當前'}</button>
                  <button onClick={() => onDelete(u.id)} className="px-3 py-1 rounded bg-rose-600 text-white">刪除</button>
                </div>
                </div>
              ))}
              {users.length===0 && <div className="text-gray-400">尚無使用者</div>}
            </div>
          </div>
        )}
        {authed && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold text-gray-100 mb-3">數據總覽與編輯</h2>
            <div className="flex items-center justify-between">
              <p className="text-gray-300">集中在單頁編輯所有站點資料（手動分數、練習結果、使用者等）。</p>
              <a href="/admin/data" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">前往編輯頁</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
