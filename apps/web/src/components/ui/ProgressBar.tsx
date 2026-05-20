export function ProgressBar({ value, max = 100, color = '#3b82f6' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 9999, height: 8, width: '100%', overflow: 'hidden' }}>
      <div style={{ background: color, height: '100%', width: `${pct}%`, borderRadius: 9999, transition: 'width 0.3s ease' }} />
    </div>
  );
}
