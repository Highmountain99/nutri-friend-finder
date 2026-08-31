import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Check,
  Flag,
  Image as ImageIcon,
  PencilLine,
  Ruler,
  Scale,
  Sparkles,
  Target,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  A fully self-contained onboarding simulation.                              */
/*  Nothing here touches the database — all state is local and thrown away.    */
/* -------------------------------------------------------------------------- */

interface SceneProps {
  onReady: (ready: boolean) => void;
}

/* ------------------------------- 1. Welcome ------------------------------- */

function WelcomeScene() {
  return (
    <div className="space-y-5 text-center py-4">
      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-primary" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-3xl text-primary leading-tight">Välkommen</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Vi går igenom appen i en liten övningsversion. Allt du gör här är på låtsas —
          inget sparas i din profil. När du är klar landar du i din egen app.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------- 2. Health profile --------------------------- */

function HealthScene({ onReady }: SceneProps) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");

  useEffect(() => {
    onReady(Boolean(weight || height || waist));
  }, [weight, height, waist, onReady]);

  const fields = [
    { icon: Scale, label: "Vikt (kg)", value: weight, set: setWeight, placeholder: "72" },
    { icon: Ruler, label: "Längd (cm)", value: height, set: setHeight, placeholder: "174" },
    { icon: Target, label: "Midjemått (cm)", value: waist, set: setWaist, placeholder: "84" },
  ];

  return (
    <div className="space-y-4">
      <SceneHeader
        title="Hälsoprofil"
        body="Fyll i dina värden — vikt, längd, blodtryck och midjemått. Din dietist bygger mål utifrån dem. Testa att fylla i något här."
      />
      <div className="space-y-2.5">
        {fields.map((f) => (
          <div
            key={f.label}
            className="rounded-2xl bg-secondary/70 border border-border p-3 flex items-center gap-3"
          >
            <f.icon className="h-4 w-4 text-primary shrink-0" strokeWidth={1.6} />
            <span className="text-xs text-muted-foreground flex-1">{f.label}</span>
            <Input
              inputMode="decimal"
              value={f.value}
              placeholder={f.placeholder}
              onChange={(e) => f.set(e.target.value.replace(/[^\d.,]/g, ""))}
              className="h-9 w-24 text-right bg-background"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 3. Log a meal ----------------------------- */

type MealPhase = "choose" | "text" | "analyzing" | "result";

const MOCK_ANALYSIS = {
  name: "Lax med rotfrukter och dillsås",
  kcal: 620,
  protein: 41,
  carbs: 48,
  fat: 27,
};

function MealScene({ onReady, onLogged }: SceneProps & { onLogged: (v: boolean) => void }) {
  const [phase, setPhase] = useState<MealPhase>("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState(MOCK_ANALYSIS.name);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback((label?: string) => {
    if (label) setName(label);
    setPhase("analyzing");
    window.setTimeout(() => setPhase("result"), 1400);
  }, []);

  useEffect(() => {
    const done = phase === "result";
    onReady(done);
    onLogged(done);
  }, [phase, onReady, onLogged]);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    analyze();
  };

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <div className="space-y-4">
      <SceneHeader
        title="Logga din mat"
        body="Ta kort på maten, välj en bild ur kamerarullen eller beskriv den i text. Vi uppskattar näringen åt dig. Prova här — måltiden sparas inte."
      />

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {phase === "choose" && (
        <div className="grid gap-2.5">
          <ChoiceRow icon={Camera} label="Ta foto" onClick={() => cameraRef.current?.click()} />
          <ChoiceRow icon={ImageIcon} label="Välj bild" onClick={() => galleryRef.current?.click()} />
          <ChoiceRow icon={PencilLine} label="Beskriv i text" onClick={() => setPhase("text")} />
        </div>
      )}

      {phase === "text" && (
        <div className="space-y-2.5">
          <Input
            autoFocus={false}
            value={text}
            placeholder="T.ex. lax med potatis och sås"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) analyze(text.trim());
            }}
            className="bg-background"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPhase("choose")}>
              Tillbaka
            </Button>
            <Button size="sm" disabled={!text.trim()} onClick={() => analyze(text.trim())}>
              Analysera
            </Button>
          </div>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="rounded-2xl bg-secondary/70 border border-border p-6 text-center space-y-2">
          <Sparkles className="h-5 w-5 text-primary mx-auto animate-pulse" strokeWidth={1.6} />
          <p className="text-sm text-muted-foreground">Analyserar måltiden…</p>
        </div>
      )}

      {phase === "result" && (
        <div className="rounded-2xl bg-secondary/70 border border-border overflow-hidden">
          {preview ? (
            <img src={preview} alt="Din måltid" className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-20 bg-primary/10 flex items-center justify-center">
              <Utensils className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
          )}
          <div className="p-4 space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background font-serif text-base"
            />
            <div className="grid grid-cols-4 gap-2">
              <MacroChip label="Kalorier" value={`${MOCK_ANALYSIS.kcal}`} tone="cal" />
              <MacroChip label="Protein" value={`${MOCK_ANALYSIS.protein} g`} tone="pro" />
              <MacroChip label="Kolhydrat" value={`${MOCK_ANALYSIS.carbs} g`} tone="carb" />
              <MacroChip label="Fett" value={`${MOCK_ANALYSIS.fat} g`} tone="fat" />
            </div>
            <p className="text-xs text-muted-foreground">
              Stämmer det inte? Justera texten och uppskattningen räknas om. Detta är en övning —
              måltiden sparas inte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ChoiceRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Camera;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-secondary/70 border border-border p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
    >
      <span className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" strokeWidth={1.6} />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

function MacroChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cal" | "pro" | "carb" | "fat";
}) {
  return (
    <div className="rounded-xl bg-background/70 p-2 text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className="text-sm font-semibold"
        style={{ color: `hsl(var(--nutrient-${tone}))` }}
      >
        {value}
      </p>
    </div>
  );
}

/* ------------------------------- 4. Goals --------------------------------- */

const GOALS = [
  { label: "Kalorier", goal: 2100, tone: "cal" as const, unit: "kcal", logged: MOCK_ANALYSIS.kcal },
  { label: "Protein", goal: 115, tone: "pro" as const, unit: "g", logged: MOCK_ANALYSIS.protein },
  { label: "Kolhydrater", goal: 240, tone: "carb" as const, unit: "g", logged: MOCK_ANALYSIS.carbs },
  { label: "Fett", goal: 70, tone: "fat" as const, unit: "g", logged: MOCK_ANALYSIS.fat },
];

function GoalsScene({ logged }: { logged: boolean }) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setFilled(true), 350);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="space-y-4">
      <SceneHeader
        title="Dagliga näringsmål"
        body={
          logged
            ? "Måltiden du precis övningsloggade räknas in direkt. Så här ser dina dagliga mål ut allt eftersom du loggar."
            : "Du och din dietist sätter dagliga mål. De fylls på automatiskt varje gång du loggar en måltid."
        }
      />
      <div className="space-y-3">
        {GOALS.map((g) => {
          const pct = filled ? Math.min(100, (g.logged / g.goal) * 100) : 0;
          return (
            <div key={g.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </span>
                <span className="text-xs text-foreground/80">
                  {g.logged} / {g.goal} {g.unit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[hsl(var(--beige-3))] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: `hsl(var(--nutrient-${g.tone}))` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- 5. Recipes ------------------------------- */

const MOCK_RECIPES = [
  { title: "Ugnsbakad torsk med ärtpuré", time: 25, tag: "Proteinrik" },
  { title: "Linsgryta med rotselleri", time: 35, tag: "Fiberrik" },
  { title: "Kikärtssallad med feta", time: 15, tag: "Snabb" },
];

function RecipeScene({ onReady }: SceneProps) {
  const [i, setI] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    onReady(i >= MOCK_RECIPES.length || saved.length > 0);
  }, [i, saved, onReady]);

  const decide = (keep: boolean) => {
    if (keep && MOCK_RECIPES[i]) setSaved((s) => [...s, MOCK_RECIPES[i].title]);
    setDrag(0);
    startX.current = null;
    setI((v) => v + 1);
  };

  const current = MOCK_RECIPES[i];

  return (
    <div className="space-y-4">
      <SceneHeader
        title="Recept"
        body="Din dietist föreslår recept här. Svep höger för att spara, vänster för att hoppa över. Prova på övningsrecepten."
      />

      <div className="relative h-52">
        {current ? (
          <div
            className="absolute inset-0 rounded-[20px] bg-secondary border border-border p-5 flex flex-col justify-end shadow-elevated touch-none select-none"
            style={{
              transform: `translateX(${drag}px) rotate(${drag / 25}deg)`,
              transition: startX.current === null ? "transform 220ms ease" : "none",
            }}
            onPointerDown={(e) => {
              startX.current = e.clientX;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (startX.current === null) return;
              setDrag(e.clientX - startX.current);
            }}
            onPointerUp={() => {
              if (Math.abs(drag) > 90) decide(drag > 0);
              else {
                startX.current = null;
                setDrag(0);
              }
            }}
          >
            <div className="absolute inset-x-0 top-0 h-24 rounded-t-[20px] bg-primary/10" />
            <div className="relative space-y-2">
              <span className="eyebrow text-[10px] text-muted-foreground">
                {current.tag} · {current.time} min
              </span>
              <h3 className="font-serif text-2xl text-primary leading-tight">{current.title}</h3>
            </div>
            {drag > 40 && (
              <span className="absolute top-4 left-4 rounded-full bg-primary text-primary-foreground text-[11px] px-3 py-1">
                Sparat
              </span>
            )}
            {drag < -40 && (
              <span className="absolute top-4 right-4 rounded-full bg-foreground/70 text-background text-[11px] px-3 py-1">
                Hoppar över
              </span>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 rounded-[20px] border border-dashed border-border flex flex-col items-center justify-center gap-2 text-center px-6">
            <Utensils className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <p className="text-sm text-foreground/80">
              {saved.length > 0
                ? `Du sparade ${saved.length} recept i övningen.`
                : "Inga fler övningsrecept."}
            </p>
          </div>
        )}
      </div>

      {current && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => decide(false)}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="icon" className="rounded-full" onClick={() => decide(true)}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ 6. Journey -------------------------------- */

const DEMO_PHASES = [
  {
    title: "Kartläggning",
    status: "done" as const,
    items: ["Hälsoprofil ifylld", "Första besöket genomfört"],
  },
  {
    title: "Nya vanor",
    status: "active" as const,
    items: ["Logga tre måltider per dag", "Öka fiberintaget", "Ett nytt recept i veckan"],
  },
  {
    title: "Stabilisering",
    status: "todo" as const,
    items: ["Behålla rutinen utan loggning varje dag"],
  },
];

function JourneyScene() {
  const [checked, setChecked] = useState<string[]>(["Hälsoprofil ifylld", "Första besöket genomfört"]);
  const toggle = (item: string) =>
    setChecked((c) => (c.includes(item) ? c.filter((x) => x !== item) : [...c, item]));

  return (
    <div className="space-y-4">
      <SceneHeader
        title="Din utveckling"
        body="Din dietist bygger en plan i faser med mål och delmål. Så här kan den se ut — kostrelaterade mål bockas av automatiskt när du loggar."
      />
      <div className="rounded-[20px] bg-secondary/70 border border-border p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-primary" strokeWidth={1.6} />
          <span className="text-sm font-medium text-foreground">
            Slutmål: stabil vikt och bättre mage till våren
          </span>
        </div>
        {DEMO_PHASES.map((p) => (
          <div key={p.title} className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  p.status === "done" && "bg-primary",
                  p.status === "active" && "bg-[hsl(var(--nutrient-carb))]",
                  p.status === "todo" && "bg-border"
                )}
              />
              <span className="eyebrow text-[10px] text-muted-foreground">{p.title}</span>
            </div>
            <div className="pl-4 space-y-1.5">
              {p.items.map((item) => {
                const on = checked.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggle(item)}
                    className="flex items-center gap-2 text-left w-full"
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                        on ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {on && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        on ? "text-muted-foreground line-through" : "text-foreground/85"
                      )}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Shared ---------------------------------- */

function SceneHeader({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h2 className="font-serif text-2xl text-primary leading-tight">{title}</h2>
      <p className="text-sm text-foreground/80 leading-relaxed">{body}</p>
    </div>
  );
}

/* --------------------------------- Shell ---------------------------------- */

export function OnboardingSimulator({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);

  const handleReady = useCallback((v: boolean) => setReady(v), []);

  const scenes = useMemo(
    () => [
      { node: <WelcomeScene />, optional: true },
      { node: <HealthScene onReady={handleReady} />, optional: true },
      { node: <MealScene onReady={handleReady} onLogged={setLogged} />, optional: true },
      { node: <GoalsScene logged={logged} />, optional: true },
      { node: <RecipeScene onReady={handleReady} />, optional: true },
      { node: <JourneyScene />, optional: true },
    ],
    [handleReady, logged]
  );

  useEffect(() => {
    setReady(false);
  }, [step]);

  const isLast = step === scenes.length - 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-background flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Introduktion"
    >
      <div
        className="flex items-center justify-between px-5 pb-2"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <span className="eyebrow text-[10px] text-muted-foreground">
          Övningsläge · {step + 1} av {scenes.length}
        </span>
        <button onClick={onFinish} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          Hoppa över
        </button>
      </div>

      <div className="px-5 pb-2 flex items-center gap-1.5">
        {scenes.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
            )}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6">{scenes[step].node}</div>

      <div
        className="px-5 pt-3 border-t border-border flex items-center justify-between gap-3"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={cn(step === 0 && "invisible")}
        >
          Tillbaka
        </Button>
        <Button size="sm" onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}>
          {isLast ? "Kom igång" : ready ? "Nästa" : "Nästa"}
        </Button>
      </div>
    </div>,
    document.body
  );
}
