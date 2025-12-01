export default function ReportDashboard({ overview }: { overview: { averageScore: number; attempts: number; latestScore: number | null } }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
        <div className="text-4xl font-bold text-blue-400">{overview.averageScore}</div>
        <div className="text-sm text-gray-300">平均分</div>
      </div>
    </div>
  );
}

