const VARIANTS: Record<string, React.CSSProperties> = {
  red: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  orange: { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' },
  green: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  blue: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  gray: { background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' },
};

export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: string }) {
  return (
    <span style={{
      ...VARIANTS[variant] ?? VARIANTS.gray,
      padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {children}
    </span>
  );
}
