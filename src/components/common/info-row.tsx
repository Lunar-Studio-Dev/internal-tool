export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm break-all">
        {value ? value : <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

/** Bordered cell for metric-style info grids on mobile. */
export function InfoMetricCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex h-full flex-col justify-center rounded-lg border bg-card p-3">
      <InfoRow label={label} value={value} />
    </div>
  );
}
