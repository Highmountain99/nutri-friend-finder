import { useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RecipeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isFocused: boolean;
  onFocus: () => void;
  onCancel: () => void;
}

export function RecipeSearchBar({
  value,
  onChange,
  isFocused,
  onFocus,
  onCancel,
}: RecipeSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCancel = () => {
    onChange("");
    onCancel();
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Vad vill du laga?"
          className="pl-10 pr-8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
        />
        {value && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {isFocused && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary shrink-0"
          onClick={handleCancel}
        >
          Avbryt
        </Button>
      )}
    </div>
  );
}
