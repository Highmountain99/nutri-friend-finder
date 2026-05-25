import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Variant = "droplet" | "orbit" | "ring" | "breath" | "wave" | "concentric";

const VARIANTS: Variant[] = ["droplet", "orbit", "ring", "breath", "wave", "concentric"];

// Natural (intrinsic) sizes defined in organic-loaders.css
const NATURAL: Record<Variant, { w: number; h: number }> = {
  droplet: { w: 90, h: 90 },
  orbit: { w: 120, h: 120 },
  ring: { w: 130, h: 130 },
  breath: { w: 110, h: 110 },
  wave: { w: 150, h: 80 },
  concentric: { w: 140, h: 140 },
};

interface OrganicLoaderProps {
  /** Target px size (longest side). Default 32 — matches the previous spinner. */
  size?: number;
  variant?: Variant;
  className?: string;
  label?: string;
}

/**
 * Organic, indeterminate loader. Inherits color from `currentColor`.
 * The inner CSS has fixed natural sizes; we scale the whole thing with
 * `transform: scale()` so it fits exactly inside a `size × size` box
 * without overlapping surrounding elements.
 */
export function OrganicLoader({ size = 32, variant, className, label = "Laddar" }: OrganicLoaderProps) {
  const picked = useMemo<Variant>(
    () => variant ?? VARIANTS[Math.floor(Math.random() * VARIANTS.length)],
    [variant]
  );

  const natural = NATURAL[picked];
  const scale = size / Math.max(natural.w, natural.h);
  const renderedW = natural.w * scale;
  const renderedH = natural.h * scale;

  let inner: JSX.Element;
  switch (picked) {
    case "orbit":
      inner = (
        <span className="loader-orbit">
          <i /><i /><i /><i />
        </span>
      );
      break;
    case "ring":
      inner = (
        <span className="loader-ring">
          <i /><i /><i /><i /><i /><i /><i /><i />
        </span>
      );
      break;
    case "breath":
      inner = <span className="loader-breath" />;
      break;
    case "wave":
      inner = (
        <svg className="loader-wave" viewBox="0 0 150 80" aria-hidden="true">
          <path d="M 5 40 Q 25 5, 45 40 T 85 40 T 125 40 T 165 40" />
        </svg>
      );
      break;
    case "concentric":
      inner = (
        <span className="loader-concentric">
          <i /><i /><i />
        </span>
      );
      break;
    case "droplet":
    default:
      inner = <span className="loader-droplet" />;
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-primary", className)}
      style={{ width: renderedW, height: renderedH, lineHeight: 0 }}
    >
      <div
        style={{
          width: natural.w,
          height: natural.h,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          flexShrink: 0,
        }}
        className="inline-flex items-center justify-center"
      >
        {inner}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default OrganicLoader;
