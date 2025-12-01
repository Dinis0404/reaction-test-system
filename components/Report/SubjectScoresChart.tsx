export default function SubjectScoresChart({ data }: { data: Array<{ label: string; score: number }> }) {
  const width = 700, height = 260, padding = 40;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const toY = (y: number) => height - padding - (y / 100) * innerH;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const toX = (idx: number) => padding + idx * stepX;
  const points = data.map((d, i) => `${toX(i)},${toY(d.score)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="bg-gray-900 rounded-lg border border-gray-700">
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#6b7280" />
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#6b7280" />
      {[0, 40, 60, 100].map(t => (
        <g key={t}>
          <line x1={padding} x2={width - padding} y1={toY(t)} y2={toY(t)} stroke={t===60?"#f59e0b":t===40?"#ef4444":"#374151"} strokeDasharray={t===60||t===40?"4 4":"2 4"} />
          <text x={padding - 8} y={toY(t)} textAnchor="end" alignmentBaseline="middle" fill="#9ca3af" fontSize="12">{t}</text>
        </g>
      ))}
      {points && <polyline points={points} fill="none" stroke="#22c55e" strokeWidth={2} />}
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={toX(i)} cy={toY(d.score)} r={3} fill="#22c55e" />
          <text x={toX(i)} y={toY(d.score) - 8} textAnchor="middle" fill="#d1d5db" fontSize="11">{Math.round(d.score * 10) / 10}</text>
          <text x={toX(i)} y={height - padding + 16} textAnchor="middle" fill="#9ca3af" fontSize="12" transform={`rotate(0 ${toX(i)} ${height - padding + 16})`}>{d.label}</text>
        </g>
      ))}
      {!data.length && (
        <text x={width/2} y={height/2} textAnchor="middle" fill="#9ca3af" fontSize="14">無數據</text>
      )}
    </svg>
  );
}
