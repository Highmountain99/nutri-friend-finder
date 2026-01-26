interface BankIdLogoProps {
  className?: string;
}

export function BankIdLogo({ className = "h-5 w-auto" }: BankIdLogoProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 32" 
      fill="currentColor"
      aria-label="BankID"
    >
      {/* Simplified BankID logo placeholder */}
      <rect x="0" y="4" width="24" height="24" rx="4" fill="currentColor" opacity="0.9" />
      <text x="32" y="22" fontSize="14" fontWeight="600" fill="currentColor">
        BankID
      </text>
    </svg>
  );
}
