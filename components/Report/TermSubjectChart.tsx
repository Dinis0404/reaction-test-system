interface Point { x: number; y: number }
interface Series { label: string; points: Point[] }

export default function TermSubjectChart({ series, subjects }: { series: Series[]; subjects: string[] }) {
  const width = 900, height = 320, padding = 40;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const stepX = subjects.length > 1 ? innerW / (subjects.length - 1) : innerW;
  const toX = (idx: number) => padding + idx * stepX;
  const minY = 40, maxY = 100;
  const toY = (score: number) => height - padding - ((Math.max(minY, Math.min(maxY, score)) - minY) / (maxY - minY)) * innerH;
  const palette = ['#60a5fa','#22c55e','#f59e0b','#ef4444'];

  return (
    <div>
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="bg-gray-900 rounded-lg border border-gray-700">
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#6b7280" />
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#6b7280" />
      {[40,60,80,100].map(t => (
        <g key={`tick-${t}`}>
          <line x1={padding} x2={width - padding} y1={toY(t)} y2={toY(t)} stroke={t===60?"#f59e0b":t===40?"#ef4444":"#374151"} strokeDasharray={t===60||t===40?"4 4":"2 4"} />
          <text x={padding - 8} y={toY(t)} textAnchor="end" alignmentBaseline="middle" fill="#9ca3af" fontSize="12">{t}</text>
        </g>
      ))}
      {subjects.map((s, i) => (
        <text key={`sub-${s}`} x={toX(i)} y={height - padding + 16} textAnchor="middle" fill="#9ca3af" fontSize="12">{s}</text>
      ))}

      {series.length === 0 && (
        <text x={width/2} y={height/2} textAnchor="middle" fill="#9ca3af" fontSize="14">無數據</text>
      )}

      {series.map((s, si) => {
        const color = palette[si % palette.length];
        const path = s.points.map((p, idx) => `${toX(idx)},${toY(p.y)}`).join(' ');
        return (
          <g key={s.label}>
            <polyline points={path} fill="none" stroke={color} strokeWidth={2} />
            {s.points.map((p, idx) => (
              <g key={`${s.label}-${idx}`}>
                <circle cx={toX(idx)} cy={toY(p.y)} r={3} fill={color} />
                {(() => {
                  const yAxis = height - padding;
                  const yP = toY(p.y);
                  const base = yP - 8;
                  const safe = yAxis - 22;
                  const top = padding + 12;
                  const yLabel = Math.max((yAxis - yP < 22 ? safe : base), top);
                  return <text x={toX(idx)} y={yLabel} textAnchor="middle" fill="#d1d5db" fontSize="11">{Math.round(p.y * 10) / 10}</text>;
                })()}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
    <div className="mt-2 flex justify-end gap-4 flex-wrap">
      {series.slice(0,4).map((s, si) => (
        <div key={`legend-${s.label}`} className="flex items-center gap-2">
          <span style={{ backgroundColor: palette[si % palette.length] }} className="inline-block w-3 h-3 rounded"></span>
          <span className="text-sm text-gray-400">{s.label}</span>
        </div>
      ))}
    </div>
    </div>
  );
}
