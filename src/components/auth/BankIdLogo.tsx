import bankIdLogo from "@/assets/bankid-logo.png";

interface BankIdLogoProps {
  className?: string;
}

export function BankIdLogo({ className = "h-5 w-auto" }: BankIdLogoProps) {
  return (
    <img 
      src={bankIdLogo} 
      alt="BankID" 
      className={className}
    />
  );
}
