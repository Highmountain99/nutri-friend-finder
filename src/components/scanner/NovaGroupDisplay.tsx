interface NovaGroupDisplayProps {
  group: 1 | 2 | 3 | 4 | null;
}

const novaData: Record<number, { color: string; label: string }> = {
  1: { color: "#1E8F4E", label: "Obearbetade livsmedel" },
  2: { color: "#EEAE0E", label: "Bearbetade ingredienser" },
  3: { color: "#FF6F1E", label: "Bearbetade livsmedel" },
  4: { color: "#E63E11", label: "Ultrabearbetade produkter" },
};

export function NovaGroupDisplay({ group }: NovaGroupDisplayProps) {
  if (!group) return null;
  const data = novaData[group];

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-full font-bold text-white"
        style={{ width: 36, height: 36, backgroundColor: data.color }}
      >
        {group}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">NOVA {group}</p>
        <p className="text-xs text-muted-foreground">{data.label}</p>
      </div>
    </div>
  );
}
