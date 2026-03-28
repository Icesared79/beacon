export function AtlasStatus({ lastUpdated }: { lastUpdated: string }) {
  const date = new Date(lastUpdated)
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--beacon-text-muted)]">
      <span className="inline-block w-2 h-2 rounded-full bg-[var(--beacon-success)]" />
      <span>Atlas data · Updated {formatted}</span>
    </div>
  )
}
