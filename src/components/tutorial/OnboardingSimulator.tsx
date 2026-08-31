import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Check,
  Clock,
  Droplets,
  Dumbbell,
  Flag,
  Flame,
  Heart,
  Image as ImageIcon,
  Menu,
  PencilLine,
  Ruler,
  Scale,
  Sparkles,
  Target,
  Users,
  Utensils,
  Wheat,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NutritionProgressCard } from "@/components/journal/NutritionProgressCard";
import salmonImg from "@/assets/recipe-salmon.jpg";
import chickenImg from "@/assets/recipe-chicken.jpg";
import soupImg from "@/assets/recipe-soup.jpg";

/* -------------------------------------------------------------------------- */
/*  A fully self-contained onboarding simulation, styled exactly like the app. */
/*  Nothing here touches the database — all state is local and thrown away.    */
/* -------------------------------------------------------------------------- */

interface SceneProps {
  onReady: (ready: boolean) => void;
}

/* ------------------------------- 1. Welcome ------------------------------- */

function WelcomeScene() {
  return (
    <div className="space-y-6 text-center py-6">
      <div className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-soft">
        <Utensils className="h-7 w-7 text-primary-foreground" strokeWidth={1.5} />
      </div>
      <div className="space-y-3">
        <p className="eyebrow text-[10px]">Övningsläge</p>
        <h2 className="font-serif text-4xl text-primary leading-[1.05]">
          Välkommen till <em className="lede not-italic">Gut Feeling</em>
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed max-w-xs mx-auto">
          Vi går igenom appen i en liten övningsversion. Allt du gör här är på
          låtsas — inget sparas i din profil. När du är klar landar du i din
          egen app.
        </p>
      </div>
    </div>
  );
}

/* ------------------------ 2. Find the health profile ---------------------- */

function FindProfileScene({ onDone }: { onDone: () => void }) {
  return (
    <div className="space-y-4">
      <SceneHeader
        title="Hitta din hälsoprofil"
        body="Din hälsoprofil ligger bakom menyknappen uppe till höger i appen. Tryck på den markerade knappen här för att testa."
      />
      {/* Mini-mock of the app header with a highlighted menu button */}
      <Card className="shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div>
              <p className="text-[10px] eyebrow text-muted-foreground">Gut Feeling</p>
              <p className="font-serif text-lg text-primary leading-tight">Hej, Anna</p>
            </div>
            <div className="relative">
              <span className="absolute -inset-1.5 rounded-full border-2 border-primary animate-ping opacity-60" aria-hidden />
              <button
                onClick={onDone}
                aria-label="Öppna hälsoprofil (övning)"
                className="relative h-11 w-11 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-soft"
              >
                <Menu className="w-5 h-5" strokeWidth={1.8} />
              </button>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-primary">
                Tryck här
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2 opacity-60 pointer-events-none" aria-hidden>
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-16 rounded-xl bg-muted/70" />
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center">
        I appen hittar du den uppe till höger på varje sida.
      </p>
    </div>
  );
}

/* ---------------------------- 3. Health profile --------------------------- */

function HealthScene({ onReady }: SceneProps) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");

  useEffect(() => {
    onReady(Boolean(weight || height || waist));
  }, [weight, height, waist, onReady]);

  const fields = [
    { icon: Scale, label: "Vikt", unit: "kg", value: weight, set: setWeight, placeholder: "72" },
    { icon: Ruler, label: "Längd", unit: "cm", value: height, set: setHeight, placeholder: "174" },
    { icon: Target, label: "Midjemått", unit: "cm", value: waist, set: setWaist, placeholder: "84" },
  ];

  return (
    <div className="space-y-4">
      <SceneHeader
        title="Hälsoprofil"
        body="Fyll i dina värden — vikt, längd och midjemått. Din dietist bygger mål utifrån dem. Testa att fylla i något här."
      />
      <div className="space-y-2.5">
        {fields.map((f) => (
          <Card key={f.label} className="shadow-soft">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center shrink-0">
                <f.icon className="w-4 h-4 text-primary" strokeWidth={1.6} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-semibold text-foreground">
                  {f.value ? `${f.value} ${f.unit}` : "Ej angivet"}
                </p>
              </div>
              <Input
                inputMode="decimal"
                value={f.value}
                placeholder={f.placeholder}
                onChange={(e) => f.set(e.target.value.replace(/[^\d.,]/g, ""))}
                className="h-9 w-20 text-right bg-background"
                aria-label={f.label}
              />
            </CardContent>
          </Card>
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

  const analyze = useCallback((label?: string, fromImage = false) => {
    if (label) setName(label);
    else if (fromImage) setName(""); // user names their own dish so it matches the photo
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
    analyze(undefined, true);
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
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-3">
            <Input
              value={text}
              placeholder="T.ex. lax med potatis och sås"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) analyze(text.trim());
              }}
              className="bg-background"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setPhase("choose")}>
                Tillbaka
              </Button>
              <Button size="sm" className="rounded-full" disabled={!text.trim()} onClick={() => analyze(text.trim())}>
                Analysera
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "analyzing" && (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center space-y-3">
            <Sparkles className="h-5 w-5 text-primary mx-auto animate-pulse" strokeWidth={1.6} />
            <p className="text-sm text-muted-foreground">Analyserar måltiden…</p>
          </CardContent>
        </Card>
      )}

      {phase === "result" && (
        <Card className="shadow-elevated overflow-hidden">
          <CardContent className="p-0">
            {preview && (
              <img src={preview} alt="Din måltid" className="w-full h-40 object-cover" />
            )}
            <div className="p-4 space-y-3">
              <Input
                value={name}
                placeholder="Vad åt du?"
                onChange={(e) => setName(e.target.value)}
                className="bg-background font-serif text-lg h-auto py-2"
              />
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Flame className="w-4 h-4 text-accent" />
                  {MOCK_ANALYSIS.kcal} kcal
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  {MOCK_ANALYSIS.protein} g protein
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Stämmer det inte? Justera texten och uppskattningen räknas om.
                Detta är en övning — måltiden sparas inte.
              </p>
            </div>
          </CardContent>
        </Card>
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
    <Card
      className="shadow-soft cursor-pointer active:scale-[0.99] transition-transform"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center shrink-0">
          <Icon className="w-4 h-4 text-primary" strokeWidth={1.6} />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- 4. Goals --------------------------------- */

const GOALS = [
  { key: "cal" as const, icon: Flame, label: "Kalorier", goal: 2100, unit: "kcal", logged: MOCK_ANALYSIS.kcal },
  { key: "pro" as const, icon: Dumbbell, label: "Protein", goal: 115, unit: "g", logged: MOCK_ANALYSIS.protein },
  { key: "carb" as const, icon: Wheat, label: "Kolhydrater", goal: 240, unit: "g", logged: MOCK_ANALYSIS.carbs },
  { key: "fat" as const, icon: Droplets, label: "Fett", goal: 70, unit: "g", logged: MOCK_ANALYSIS.fat },
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
      <div className="grid grid-cols-2 gap-2.5">
        {GOALS.map((g) => (
          <NutritionProgressCard
            key={g.key}
            icon={g.icon}
            label={g.label}
            nutrient={g.key}
            goal={g.goal}
            unit={g.unit}
            remaining={filled && logged ? g.goal - g.logged : g.goal}
          />
        ))}
      </div>
      {logged && (
        <p className="text-xs text-muted-foreground text-center">
          Din övningsmåltid på {MOCK_ANALYSIS.kcal} kcal är inräknad.
        </p>
      )}
    </div>
  );
}

/* ------------------------------- 5. Recipes ------------------------------- */

const MOCK_RECIPES = [
  {
    title: "Ugnsbakad lax med ärtpuré",
    time: 25,
    servings: 2,
    tag: "Proteinrik",
    img: salmonImg,
    message: "Bra proteinkälla inför veckan — testa gärna!",
  },
  {
    title: "Kycklinggryta med rotfrukter",
    time: 35,
    servings: 4,
    tag: "Fiberrik",
    img: chickenImg,
    message: "Mild mot magen och enkel att laga i stor sats.",
  },
  {
    title: "Krämig linsoppa med rotselleri",
    time: 30,
    servings: 3,
    tag: "Snabb",
    img: soupImg,
    message: "Värmande och fiberrik vardagsfavorit.",
  },
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

      <div className="relative">
        {current ? (
          <Card
            className="shadow-elevated overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y"
            style={{
              transform: `translateX(${drag}px) rotate(${drag / 25}deg)`,
              opacity: Math.max(0.6, 1 - Math.abs(drag) / 400),
              transition: startX.current === null ? "transform 220ms ease, opacity 220ms ease" : "none",
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
              if (Math.abs(drag) > 80) decide(drag > 0);
              else {
                startX.current = null;
                setDrag(0);
              }
            }}
          >
            <CardContent className="p-0">
              <div className="relative h-44 bg-muted">
                <img
                  src={current.img}
                  alt={current.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {drag > 30 && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-4">
                      <Heart className="w-8 h-8" />
                    </div>
                  </div>
                )}
                {drag < -30 && (
                  <div className="absolute inset-0 bg-destructive/30 flex items-center justify-center">
                    <div className="bg-destructive text-destructive-foreground rounded-full p-4">
                      <X className="w-8 h-8" />
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-accent/90 text-accent-foreground gap-1">
                    <Sparkles className="w-3 h-3" />
                    Din dietist
                  </Badge>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <h3 className="font-semibold text-lg text-foreground leading-snug">
                  {current.title}
                </h3>
                <p className="text-sm text-muted-foreground italic">"{current.message}"</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {current.time} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {current.servings} port
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">{current.tag}</Badge>
              </div>
              <div className="flex gap-2 p-4 pt-0">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => decide(false)}
                >
                  <X className="w-4 h-4" />
                  Inte nu
                </Button>
                <Button className="flex-1 gap-2" onClick={() => decide(true)}>
                  <Heart className="w-4 h-4" />
                  Spara
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft border-dashed">
            <CardContent className="p-8 flex flex-col items-center justify-center gap-2 text-center">
              <Utensils className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <p className="text-sm text-foreground/80">
                {saved.length > 0
                  ? `Du sparade ${saved.length} recept i övningen.`
                  : "Inga fler övningsrecept."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {current && (
        <p className="text-[11px] text-muted-foreground text-center">
          Svep på kortet — eller använd knapparna
        </p>
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
      <Card className="shadow-soft rounded-[20px]">
        <CardContent className="p-5 space-y-5">
          <div className="space-y-1">
            <p className="eyebrow text-[10px]">Slutmål</p>
            <div className="flex items-start gap-2">
              <Flag className="h-4 w-4 text-primary mt-1 shrink-0" strokeWidth={1.6} />
              <p className="font-serif text-xl text-primary leading-tight">
                Stabil vikt och bättre mage till våren
              </p>
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------- Shared ---------------------------------- */

function SceneHeader({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h2 className="font-serif text-3xl text-primary leading-[1.05]">{title}</h2>
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
      { node: <WelcomeScene /> },
      { node: <FindProfileScene onDone={() => { handleReady(true); setStep((s) => s + 1); }} /> },
      { node: <HealthScene onReady={handleReady} /> },
      { node: <MealScene onReady={handleReady} onLogged={setLogged} /> },
      { node: <GoalsScene logged={logged} /> },
      { node: <RecipeScene onReady={handleReady} /> },
      { node: <JourneyScene /> },
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
        <span className="eyebrow text-[10px]">
          Övningsläge · {step + 1} av {scenes.length}
        </span>
        <button
          onClick={onFinish}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
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
          className={cn("rounded-full", step === 0 && "invisible")}
        >
          Tillbaka
        </Button>
        <Button
          size="sm"
          className="rounded-full px-6"
          onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}
        >
          {isLast ? "Kom igång" : "Nästa"}
        </Button>
      </div>
    </div>,
    document.body
  );
}
