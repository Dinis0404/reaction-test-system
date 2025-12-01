export default function CategoryBreakdown({ cats }: { cats: Array<{ category: string; average: number; attempts: number }> }) {
  return (
    <div className="space-y-2">
      {cats.map(c => (
        <div key={c.category} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex justify-between text-gray-200 mb-2">
            <span className="font-semibold">{c.category}</span>
            <span>{c.average} 分 / {c.attempts} 次</span>
          </div>
          <div className="w-full bg-gray-700 h-3 rounded">
            <div className="h-3 rounded bg-gradient-to-r from-green-500 to-emerald-600" style={{ width: `${c.average}%` }} />
          </div>
        </div>
      ))}
      {cats.length === 0 && <div className="text-gray-400">尚無分類資料</div>}
    </div>
  );
}

