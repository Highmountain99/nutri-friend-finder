interface NutriScoreDisplayProps {
  grade: "a" | "b" | "c" | "d" | "e" | null;
}

const colors: Record<string, string> = {
  a: "#1E8F4E",
  b: "#60AC0E",
  c: "#EEAE0E",
  d: "#FF6F1E",
  e: "#E63E11",
};

export function NutriScoreDisplay({ grade }: NutriScoreDisplayProps) {
  if (!grade) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Nutri-Score ej tillgänglig</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {(["a", "b", "c", "d", "e"] as const).map((letter) => {
        const isActive = letter === grade;
        return (
          <div
            key={letter}
            className="flex items-center justify-center rounded-md font-bold uppercase transition-all"
            style={{
              width: isActive ? 40 : 28,
              height: isActive ? 40 : 28,
              fontSize: isActive ? 20 : 12,
              backgroundColor: isActive ? colors[letter] : "hsl(var(--muted))",
              color: isActive ? "#fff" : "hsl(var(--muted-foreground))",
            }}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}
