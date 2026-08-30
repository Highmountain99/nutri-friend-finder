import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userName?: string;
  onMenuClick: () => void;
}

export function Header({ userName = "där", onMenuClick }: HeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "God morgon";
    if (hour < 17) return "God eftermiddag";
    return "God kväll";
  };

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">

        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          data-tour="profile"
          className="text-primary hover:bg-secondary"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="text-center leading-none">
          <p className="eyebrow text-[10px]">{getGreeting()}</p>
          <h1 className="font-serif text-2xl text-primary mt-1">
            <span className="italic">{userName}</span>
          </h1>
        </div>

        <div className="w-10 h-10" aria-hidden="true" />
      </div>
    </header>
  );
}
