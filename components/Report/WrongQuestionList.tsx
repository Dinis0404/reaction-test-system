export default function WrongQuestionList({ items }: { items: Array<{ questionId: number; times: number }> }) {
  return (
    <div className="space-y-2">
      {items.map(it => (
        <div key={it.questionId} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between">
          <span className="text-gray-200">題目 {it.questionId}</span>
          <span className="text-red-300">錯誤 {it.times} 次</span>
        </div>
      ))}
      {items.length === 0 && <div className="text-gray-400">暫無錯題統計</div>}
    </div>
  );
}

