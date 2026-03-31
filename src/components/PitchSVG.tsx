export default function PitchSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 260" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="396" height="256" rx="4" stroke="#10b981" strokeWidth="2" fill="none" opacity="0.3" />
      <line x1="200" y1="2" x2="200" y2="258" stroke="#10b981" strokeWidth="1.5" opacity="0.3" />
      <circle cx="200" cy="130" r="40" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3" />
      <circle cx="200" cy="130" r="3" fill="#10b981" opacity="0.5" />
      <rect x="2" y="70" width="60" height="120" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3" />
      <rect x="2" y="100" width="25" height="60" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3" />
      <rect x="338" y="70" width="60" height="120" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3" />
      <rect x="373" y="100" width="25" height="60" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M 62 110 A 20 20 0 0 1 62 150" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M 338 110 A 20 20 0 0 0 338 150" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3" />
    </svg>
  );
}
