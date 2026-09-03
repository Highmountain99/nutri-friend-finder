import { Menu } from "lucide-react";

interface HeaderProps {
  userName?: string;
  onMenuClick: () => void;
}

export function Header({ userName = "där", onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <button
          onClick={onMenuClick}
          data-tour="profile"
          aria-label="Öppna meny"
          className="h-10 w-10 rounded-pill flex items-center justify-center text-primary hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>

        <span className="display text-base tracking-[0.04em]">Gutfeeling</span>

        <div className="w-10 h-10" aria-hidden="true" />
      </div>
    </header>
  );
}
