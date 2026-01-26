import { Menu, Leaf } from "lucide-react";
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
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-foreground"
        >
          <Menu className="w-6 h-6" />
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-lg font-semibold text-foreground">{userName}!</h1>
        </div>

        <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center shadow-soft">
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </header>
  );
}
