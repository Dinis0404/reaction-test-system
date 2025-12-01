interface Point { t: number; score: number }

export default function ManualTrendChart({ data }: { data: Point[] }) {
  const width = 600, height = 200, padding = 20;
  const toX = (x: number) => padding + (x - 1) * ((width - 2 * padding) / Math.max(1, 3));
  const toY = (y: number) => height - padding - y * (height - 2 * padding) / 100;
  const points = data.map(d => `${toX(d.t)},${toY(d.score)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="bg-gray-900 rounded-lg border border-gray-700">
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#6b7280" />
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#6b7280" />
      <line x1={padding} x2={width - padding} y1={toY(60)} y2={toY(60)} stroke="#f59e0b" strokeDasharray="4 4" />
      <line x1={padding} x2={width - padding} y1={toY(40)} y2={toY(40)} stroke="#ef4444" strokeDasharray="4 4" />
      <polyline points={points} fill="none" stroke="#22c55e" strokeWidth={2} />
    </svg>
  );
}

