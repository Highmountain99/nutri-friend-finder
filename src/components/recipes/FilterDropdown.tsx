import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface FilterDropdownProps {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}

export function FilterDropdown({
  label,
  options,
  selected,
  onSelectionChange,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;
    
    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  const toggleOption = (optionId: string) => {
    if (selected.includes(optionId)) {
      onSelectionChange(selected.filter((id) => id !== optionId));
    } else {
      onSelectionChange([...selected, optionId]);
    }
  };

  const hasSelection = selected.length > 0;

  return (
    <div className="relative flex-shrink-0">
      <Button
        ref={buttonRef}
        variant={hasSelection ? "default" : "outline"}
        size="sm"
        className={cn(
          "rounded-full text-xs h-8 px-3 gap-1 whitespace-nowrap",
          hasSelection && "bg-primary text-primary-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
        {hasSelection && <span className="ml-1 font-bold">{selected.length}</span>}
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed min-w-[180px] bg-popover border border-border rounded-lg shadow-lg py-1 max-h-[300px] overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 9999,
            }}
          >
            {options.map((option) => {
              const isSelected = selected.includes(option.id);
              return (
                <button
                  key={option.id}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                    isSelected && "bg-muted/50"
                  )}
                  onClick={() => toggleOption(option.id)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-foreground">{option.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
