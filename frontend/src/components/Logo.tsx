'use client';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className || 'w-10 h-10'}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#7B00E0" />
      <path
        d="M24 14C20 14 17 17.5 17 21c0 7 7 13 7 13s7-6 7-13c0-3.5-3-7-7-7z"
        fill="white"
      />
      <path
        d="M12 26h6l2-4 3 8 2-6 3 4h8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
