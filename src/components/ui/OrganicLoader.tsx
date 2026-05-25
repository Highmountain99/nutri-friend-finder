import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Variant = "droplet" | "orbit" | "ring" | "breath" | "wave" | "concentric";

const VARIANTS: Variant[] = ["droplet", "orbit", "ring", "breath", "wave", "concentric"];

interface OrganicLoaderProps {
  /** px size of the loader (controls width/height). Default 80. */
  size?: number;
  /** Force a specific variant; otherwise picks randomly per mount. */
  variant?: Variant;
  className?: string;
  label?: string;
}

/**
 * Organic, indeterminate loader. Replaces traditional spinners.
 * Inherits color from `currentColor` — wrap with `text-primary` etc.
 */
export function OrganicLoader({ size = 80, variant, className, label = "Laddar" }: OrganicLoaderProps) {
  const picked = useMemo<Variant>(
    () => variant ?? VARIANTS[Math.floor(Math.random() * VARIANTS.length)],
    [variant]
  );

  const style =
    picked === "wave"
      ? { width: size * 1.6, height: size * 0.85 }
      : { width: size, height: size };

  let inner: JSX.Element;
  switch (picked) {
    case "orbit":
      inner = (
        <span className="loader-orbit" style={style}>
          <i /><i /><i /><i />
        </span>
      );
      break;
    case "ring":
      inner = (
        <span className="loader-ring" style={style}>
          <i /><i /><i /><i /><i /><i /><i /><i />
        </span>
      );
      break;
    case "breath":
      inner = <span className="loader-breath" style={style} />;
      break;
    case "wave":
      inner = (
        <svg className="loader-wave" style={style} viewBox="0 0 150 80" aria-hidden="true">
          <path d="M 5 40 Q 25 5, 45 40 T 85 40 T 125 40 T 165 40" />
        </svg>
      );
      break;
    case "concentric":
      inner = (
        <span className="loader-concentric" style={style}>
          <i /><i /><i />
        </span>
      );
      break;
    case "droplet":
    default:
      inner = <span className="loader-droplet" style={style} />;
  }

  return (
    <div role="status" aria-label={label} className={cn("inline-flex items-center justify-center text-primary", className)}>
      {inner}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default OrganicLoader;
