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
      {/* Lighthouse tower */}
      <rect x="17" y="18" width="6" height="16" rx="1" fill={color} opacity="0.9" />

      {/* Lighthouse top/light housing */}
      <rect x="15" y="14" width="10" height="5" rx="1" fill={color} />

      {/* Light beam — left */}
      <path
        d="M14 16 L4 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Light beam — right */}
      <path
        d="M26 16 L36 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Light beam — upper left */}
      <path
        d="M15 14 L8 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Light beam — upper right */}
      <path
        d="M25 14 L32 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Light glow at top */}
      <circle cx="20" cy="13" r="3" fill={color} opacity="0.3" />
      <circle cx="20" cy="13" r="1.5" fill={color} />

      {/* Base */}
      <rect x="13" y="34" width="14" height="3" rx="1.5" fill={color} opacity="0.7" />

      {/* Water/ground line */}
      <path
        d="M8 37 Q14 35 20 37 Q26 39 32 37"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}

export function BeaconFavicon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="6" fill="#1B5EA8" />

      {/* Simplified lighthouse */}
      <rect x="14" y="14" width="4" height="12" rx="0.5" fill="white" opacity="0.9" />
      <rect x="12" y="11" width="8" height="4" rx="0.5" fill="white" />

      {/* Light beams */}
      <path d="M11 13 L4 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M21 13 L28 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M12 11 L7 5" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M20 11 L25 5" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.5" />

      {/* Glow */}
      <circle cx="16" cy="10" r="2" fill="white" opacity="0.4" />
      <circle cx="16" cy="10" r="1" fill="white" />

      {/* Base */}
      <rect x="10" y="26" width="12" height="2" rx="1" fill="white" opacity="0.6" />
    </svg>
  )
}
