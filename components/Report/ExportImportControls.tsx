export default function ExportImportControls() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-gray-100 mb-3">導出 / 導入</h3>
        <div className="flex gap-3">
          <a
            href="#"
            download={`results-${Date.now()}.json`}
            className="px-4 py-2 bg-blue-600 text白 rounded-lg"
            onClick={(e) => {
              e.preventDefault();
              const data = localStorage.getItem('quiz_results') || '{"schemaVersion":1,"records":[]}';
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `results-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >導出 JSON</a>
          <label className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg cursor-pointer">
            導入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={async (ev) => {
              const file = ev.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                const current = JSON.parse(localStorage.getItem('quiz_results') || '{"schemaVersion":1,"records":[]}');
                const incoming = JSON.parse(text);
                const idSet = new Set((current.records || []).map((r: any) => r.id));
                const toAdd = (incoming.records || []).filter((r: any) => !idSet.has(r.id));
                const merged = { schemaVersion: 1, records: [...(current.records || []), ...toAdd] };
                localStorage.setItem('quiz_results', JSON.stringify(merged));
                alert(`已導入 ${toAdd.length} 筆`);
              } catch (e: any) {
                alert('導入失敗：' + (e?.message || '未知錯誤'));
              }
            }} />
          </label>
        </div>
      </div>
  );
}

