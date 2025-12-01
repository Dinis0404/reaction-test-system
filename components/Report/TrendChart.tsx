interface TrendPoint { t: number; score: number }
export default function TrendChart({ data, overlay }: { data: TrendPoint[]; overlay?: TrendPoint[] }) {
  const width = 600, height = 200, padding = 20;
  const xs = data.map(d => d.t);
  const minX = xs[0] ?? 0, maxX = xs[xs.length - 1] ?? 1;
  const toX = (x: number) => padding + (x - minX) * (width - 2 * padding) / Math.max(1, maxX - minX);
  const toY = (y: number) => height - padding - (y) * (height - 2 * padding) / 100;
  const points = data.map((d) => `${toX(d.t)},${toY(d.score)}`).join(' ');
  const toOverlayX = (idx: number, total: number) => padding + (idx) * ((width - 2 * padding) / Math.max(1, total - 1 || 1));
  const overlayPoints = overlay && overlay.length ? overlay.map((d, i) => `${toOverlayX(i, overlay.length)},${toY(d.score)}`).join(' ') : '';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="bg-gray-900 rounded-lg border border-gray-700">
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#6b7280" />
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#6b7280" />
      <line x1={padding} x2={width - padding} y1={toY(60)} y2={toY(60)} stroke="#f59e0b" strokeDasharray="4 4" />
      <line x1={padding} x2={width - padding} y1={toY(40)} y2={toY(40)} stroke="#ef4444" strokeDasharray="4 4" />
      <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth={2} />
      {data.map(d => (
        <circle key={d.t} cx={toX(d.t)} cy={toY(d.score)} r={2.5} fill="#60a5fa" />
      ))}
      {overlayPoints && <polyline points={overlayPoints} fill="none" stroke="#22c55e" strokeWidth={2} />}
      {overlay && overlay.map((d, i) => (
        <circle key={`o-${i}`} cx={toOverlayX(i, overlay.length)} cy={toY(d.score)} r={2.5} fill="#22c55e" />
      ))}
      {!points && !overlayPoints && (
        <text x={width/2} y={height/2} textAnchor="middle" fill="#9ca3af" fontSize="14">無數據</text>
      )}
    </svg>
  );
}
