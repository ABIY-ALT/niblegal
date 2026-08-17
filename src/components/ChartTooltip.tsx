'use client';

/**
 * Themed Recharts tooltip.
 *
 * Recharts' default tooltip paints a hardcoded white box with a grey border,
 * which reads as a foreign element on this app's surfaces and is unreadable in
 * the dark theme. This renders on the same tokens as every other panel.
 */
export interface ChartTooltipPayloadItem {
  name?: string | number;
  value?: string | number;
  color?: string;
  fill?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix = '',
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '9px 12px',
        boxShadow: 'var(--shadow-md)',
        fontSize: 12,
      }}
    >
      {label !== undefined && label !== '' && (
        <div style={{ fontWeight: 700, marginBottom: 5, color: 'var(--text-primary)' }}>{label}</div>
      )}
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-secondary)',
            marginTop: i ? 3 : 0,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 3,
              flexShrink: 0,
              background: p.color || p.fill || 'var(--primary)',
            }}
          />
          <span style={{ flex: 1 }}>{p.name}</span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {p.value}{valueSuffix}
          </strong>
        </div>
      ))}
    </div>
  );
}
