const VARIANTS: Record<string, React.CSSProperties> = {
  primary: { background: '#1e40af', color: '#fff', border: 'none' },
  secondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
  danger: { background: '#dc2626', color: '#fff', border: 'none' },
  ghost: { background: 'transparent', color: '#6b7280', border: 'none' },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', style, children, ...props }: ButtonProps) {
  return (
    <button
      style={{
        ...VARIANTS[variant] ?? VARIANTS.primary,
        padding: size === 'sm' ? '6px 12px' : '8px 16px',
        borderRadius: 8, fontSize: size === 'sm' ? 13 : 14, fontWeight: 500,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
        opacity: props.disabled ? 0.6 : 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
