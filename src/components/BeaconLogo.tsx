export function BeaconLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Lighthouse base */}
      <rect x="17" y="32" width="14" height="8" rx="1" fill="#1B5EA8" />
      <rect x="19" y="24" width="10" height="10" rx="1" fill="#2B74C8" />
      {/* Lighthouse tower */}
      <path d="M21 12L24 6L27 12V24H21V12Z" fill="#1B5EA8" />
      {/* Light beam left */}
      <path
        d="M22 10L8 4L10 8L22 12Z"
        fill="#E8540A"
        opacity="0.7"
      />
      {/* Light beam right */}
      <path
        d="M26 10L40 4L38 8L26 12Z"
        fill="#E8540A"
        opacity="0.7"
      />
      {/* Light glow */}
      <circle cx="24" cy="9" r="3" fill="#E8540A" opacity="0.9" />
      <circle cx="24" cy="9" r="5" fill="#E8540A" opacity="0.2" />
      {/* Window */}
      <rect x="22.5" y="27" width="3" height="4" rx="0.5" fill="#EBF2FB" />
      {/* Base stripe */}
      <rect x="17" y="36" width="14" height="1.5" fill="#144A87" />
    </svg>
  );
}
