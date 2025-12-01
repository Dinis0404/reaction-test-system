interface Point { t: number; score: number }
interface Series { label: string; points: Point[] }

export default function MultiTermSubjectChart({ series, terms = [1,2,3,4] }: { series: Series[]; terms?: number[] }) {
  const width = 700, height = 260, padding = 40;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const toY = (y: number) => height - padding - (y / 100) * innerH;
  const stepX = terms.length > 1 ? innerW / (terms.length - 1) : innerW;
  const toXByTerm = (t: number) => {
    const idx = Math.max(0, terms.indexOf(t));
    return padding + idx * stepX;
  };
  const palette = ['#60a5fa','#22c55e','#f59e0b','#ef4444','#a78bfa','#10b981','#f97316','#84cc16','#e11d48','#06b6d4'];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="bg-gray-900 rounded-lg border border-gray-700">
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#6b7280" />
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#6b7280" />
      {[0,40,60,100].map(t => (
        <g key={`g-${t}`}>
          <line x1={padding} x2={width - padding} y1={toY(t)} y2={toY(t)} stroke={t===60?"#f59e0b":t===40?"#ef4444":"#374151"} strokeDasharray={t===60||t===40?"4 4":"2 4"} />
          <text x={padding - 8} y={toY(t)} textAnchor="end" alignmentBaseline="middle" fill="#9ca3af" fontSize="12">{t}</text>
        </g>
      ))}
      {terms.map((t, i) => (
        <text key={`term-${t}`} x={padding + i * stepX} y={height - padding + 16} textAnchor="middle" fill="#9ca3af" fontSize="12">第{t}學段</text>
      ))}
      {series.length === 0 && (
        <text x={width/2} y={height/2} textAnchor="middle" fill="#9ca3af" fontSize="14">無數據</text>
      )}
      {series.map((s, si) => {
        const color = palette[si % palette.length];
        const pts = s.points.map(p => `${toXByTerm(p.t)},${toY(p.score)}`).join(' ');
        return (
          <g key={s.label}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
            {s.points.map((p, pi) => (
              <circle key={`${s.label}-${pi}`} cx={toXByTerm(p.t)} cy={toY(p.score)} r={3} fill={color} />
            ))}
          </g>
        );
      })}
      <g>
        {series.slice(0,6).map((s, si) => (
          <g key={`legend-${s.label}`}>
            <rect x={padding} y={padding - 26 - si*16} width={10} height={10} fill={palette[si % palette.length]} />
            <text x={padding + 16} y={padding - 17 - si*16} fill="#9ca3af" fontSize="12">{s.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

