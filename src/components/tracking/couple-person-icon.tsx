export function BrideIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="6.5" r="2.5" />
      <path d="M8.5 21c.6-3.2 1.8-5 3.5-5s2.9 1.8 3.5 5" />
      <path d="M7 11.5c1.2-1.6 2.8-2.5 5-2.5s3.8.9 5 2.5" />
      <path d="M6 14.5 12 11l6 3.5" />
    </svg>
  );
}

export function GroomIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="7" r="2.5" />
      <path d="M8.5 21c.5-3.5 1.7-5.5 3.5-5.5s3 2 3.5 5.5" />
      <path d="M9.5 12.5h5" />
      <path d="M10.5 10.5h3" />
    </svg>
  );
}
