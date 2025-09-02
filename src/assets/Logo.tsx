export default function Logo({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#49e5a3"/>
          <stop offset="1" stopColor="#1fcd89"/>
        </linearGradient>
      </defs>
      {/* plate */}
      <circle cx="60" cy="60" r="48" fill="url(#g)" opacity="0.18"/>
      <circle cx="60" cy="60" r="36" fill="none" stroke="url(#g)" strokeWidth="6"/>
      {/* fork */}
      <rect x="30" y="28" width="6" height="40" rx="3" fill="url(#g)"/>
      <rect x="38" y="28" width="6" height="40" rx="3" fill="url(#g)"/>
      <rect x="46" y="28" width="6" height="40" rx="3" fill="url(#g)"/>
      <rect x="38" y="68" width="6" height="26" rx="3" fill="url(#g)"/>
      {/* knife */}
      <path d="M78 28c8 18 8 36 0 54l-6 8c-2 2-6 1-6-2V30c0-3 4-4 6-2l6 8z" fill="url(#g)"/>
    </svg>
  );
}
