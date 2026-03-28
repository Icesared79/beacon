export function BeaconLogo({
  className = 'h-8 w-8',
  color = 'currentColor',
  size,
}: {
  className?: string
  color?: string
  size?: number
}) {
  const sizeProps = size ? { width: size, height: size } : {}
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...sizeProps}
    >
      <rect x="17" y="18" width="6" height="16" rx="1" fill={color} opacity="0.9" />
      <rect x="15" y="14" width="10" height="5" rx="1" fill={color} />
      <path d="M14 16 L4 10" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M26 16 L36 10" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M15 14 L8 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M25 14 L32 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="20" cy="13" r="3" fill={color} opacity="0.3" />
      <circle cx="20" cy="13" r="1.5" fill={color} />
      <rect x="13" y="34" width="14" height="3" rx="1.5" fill={color} opacity="0.7" />
      <path d="M8 37 Q14 35 20 37 Q26 39 32 37" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
    </svg>
  )
}
