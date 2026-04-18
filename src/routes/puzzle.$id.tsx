import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PUZZLES, TRAP_PENALTY_SECONDS } from "@/game/content";
import { PuzzleShell } from "@/components/game/PuzzleShell";
import { AnswerForm } from "@/components/game/AnswerForm";
import { Button } from "@/components/ui/button";
import { addPenalty, markSolved } from "@/game/state";

export const Route = createFileRoute("/puzzle/$id")({
  component: PuzzleRoute,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      Puzzle not found.{" "}
      <Link to="/door" className="text-gold underline">
        Back to door
      </Link>
    </div>
  ),
});

function PuzzleRoute() {
  const { id } = Route.useParams();
  const puzzle = PUZZLES.find((p) => p.id === Number(id));
  if (!puzzle) {
    return (
      <div className="p-10 text-center">
        Unknown puzzle.{" "}
        <Link to="/door" className="text-gold underline">
          Back to door
        </Link>
      </div>
    );
  }

  return (
    <PuzzleShell puzzle={puzzle}>
      {puzzle.id === 1 && <AnswerForm puzzle={puzzle} placeholder="Type the missing word" />}
      {puzzle.id === 2 && <HiddenSymbols />}
      {puzzle.id === 3 && <Library />}
      {puzzle.id === 4 && <PathOfRighteous />}
      {puzzle.id === 5 && <NameThatTune />}
      {puzzle.id === 6 && (
        <AnswerForm puzzle={puzzle} placeholder="Enter a number" inputMode="numeric" />
      )}
      {puzzle.id === 7 && <StainedGlass />}
      {puzzle.id === 8 && <VoicesInWilderness />}
      {puzzle.id === 9 && <Timeline />}
    </PuzzleShell>
  );
}

/* ---------- Puzzle 2: Hidden in Plain Sight ---------- */
function HiddenSymbols() {
  const symbols = [
    { id: "dove", x: 12, y: 22, label: "🕊️" },
    { id: "fish", x: 78, y: 30, label: "🐟" },
    { id: "cross", x: 50, y: 12, label: "✝️" },
    { id: "lamb", x: 22, y: 75, label: "🐑" },
    { id: "bread", x: 70, y: 78, label: "🍞" },
  ];
  const [found, setFound] = useState<string[]>([]);
  const navigate = useNavigate();
  const allFound = found.length === symbols.length;

  return (
    <div className="space-y-4">
      <div
        className="relative w-full overflow-hidden rounded-lg border border-gold/30"
        style={{
          aspectRatio: "16/9",
          background:
            "radial-gradient(ellipse at center, oklch(0.32 0.08 300), oklch(0.16 0.04 300))",
        }}
      >
        {/* Stained-glass-ish backdrop */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute left-1/4 top-0 h-full w-1 bg-gold/40" />
          <div className="absolute left-1/2 top-0 h-full w-1 bg-gold/40" />
          <div className="absolute left-3/4 top-0 h-full w-1 bg-gold/40" />
        </div>
        {symbols.map((s) => {
          const isFound = found.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => !isFound && setFound((f) => [...f, s.id])}
              className={`absolute -translate-x-1/2 -translate-y-1/2 text-2xl md:text-3xl transition-all ${
                isFound ? "scale-125 drop-shadow-[0_0_10px_gold]" : "opacity-50 hover:opacity-100"
              }`}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              aria-label={s.id}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="text-center text-sm text-muted-foreground">
        Found {found.length} / {symbols.length}
      </div>
      {allFound && (
        <AnswerForm puzzle={PUZZLES[1]} placeholder="Five symbols, one word..." />
      )}
      {!allFound && (
        <p className="text-center text-xs text-muted-foreground">
          Find all five symbols to unlock the answer field.
        </p>
      )}
      <div className="hidden">{navigate.toString()}</div>
    </div>
  );
}

/* ---------- Puzzle 3: Locked Library ---------- */
function Library() {
  const books = [
    { id: "genesis", name: "Genesis", real: true, order: 1 },
    { id: "hezekiah", name: "Hezekiah", real: false },
    { id: "exodus", name: "Exodus", real: true, order: 2 },
    { id: "opinions", name: "First Opinions", real: false },
    { id: "leviticus", name: "Leviticus", real: true, order: 3 },
    { id: "numbers", name: "Numbers", real: true, order: 4 },
    { id: "melchizedek", name: "Melchizedek", real: false },
  ];
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function pick(id: string) {
    const b = books.find((x) => x.id === id)!;
    if (!b.real) {
      setError(`"${b.name}" is not a book of the Bible.`);
      return;
    }
    if (picked.includes(id)) return;
    const next = [...picked, id];
    const expected = books.filter((x) => x.real).sort((a, b) => a.order! - b.order!).map((x) => x.id);
    if (expected[next.length - 1] !== id) {
      setError("Wrong order. Start over with Genesis.");
      setPicked([]);
      return;
    }
    setError("");
    setPicked(next);
    if (next.length === expected.length) {
      markSolved(3);
      setTimeout(() => navigate({ to: "/door" }), 600);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Click books in correct biblical order. Decoys will sound the alarm.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {books.map((b) => {
          const done = picked.includes(b.id);
          return (
            <button
              key={b.id}
              onClick={() => pick(b.id)}
              className={`rounded border-2 p-4 text-left transition ${
                done
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border bg-background/40 hover:border-gold/40"
              }`}
            >
              <div className="font-display">{b.name}</div>
              {done && <div className="text-xs">#{picked.indexOf(b.id) + 1}</div>}
            </button>
          );
        })}
      </div>
      {error && <div className="text-center text-sm text-destructive">{error}</div>}
    </div>
  );
}

/* ---------- Puzzle 4: Path of the Righteous ---------- */
function PathOfRighteous() {
  // 3 cols x 4 rows. Safe = middle column (index 1) all rows.
  const cols = 3;
  const rows = 4;
  const safe = new Set([1, 4, 7, 10]); // middle column
  const [step, setStep] = useState(0); // expected row
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function step_(idx: number) {
    if (locked) return;
    const row = Math.floor(idx / cols);
    if (row !== step) {
      setError("Step in order, row by row.");
      return;
    }
    if (!safe.has(idx)) {
      setError("The stone crumbles! −30 seconds.");
      addPenalty(TRAP_PENALTY_SECONDS);
      setLocked(true);
      setTimeout(() => {
        setLocked(false);
        setStep(0);
        setError("");
      }, 1500);
      return;
    }
    setError("");
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep === rows) {
      markSolved(4);
      setTimeout(() => navigate({ to: "/door" }), 600);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Cross row by row. Choose wisely.
      </p>
      <div className={`mx-auto grid grid-cols-3 gap-2 max-w-sm ${locked ? "pointer-events-none opacity-60" : ""}`}>
        {Array.from({ length: rows * cols }).map((_, i) => {
          const safeStone = safe.has(i);
          const reached = i < step * cols ? safeStone : false;
          return (
            <button
              key={i}
              onClick={() => step_(i)}
              className={`aspect-square rounded border-2 transition ${
                reached
                  ? "border-gold bg-gold/20"
                  : "border-border bg-background/40 hover:border-gold/40"
              }`}
              aria-label={`stone-${i}`}
            />
          );
        })}
      </div>
      <div className="text-center text-sm">
        {error ? <span className="text-destructive">{error}</span> : <span className="text-muted-foreground">Row {step + 1} of {rows}</span>}
      </div>
    </div>
  );
}

/* ---------- Puzzle 5: Name That Tune ---------- */
function NameThatTune() {
  return (
    <div className="space-y-4">
      <div className="rounded border border-dashed border-gold/40 p-4 text-center text-sm text-muted-foreground">
        🎵 [Audio placeholder — replace this with a 5-second clip of "Amazing Grace"]
        <audio controls className="mt-3 mx-auto w-full max-w-sm">
          <source src="" />
        </audio>
      </div>
      <AnswerForm puzzle={PUZZLES[4]} placeholder="Name the hymn" />
    </div>
  );
}

/* ---------- Puzzle 7: Broken Stained Glass ---------- */
function StainedGlass() {
  const target = ["T", "R", "U", "T", "H"];
  const [pool, setPool] = useState<string[]>(["U", "H", "R", "T", "T"]);
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const navigate = useNavigate();

  function place(letter: string) {
    const i = slots.findIndex((s) => s === null);
    if (i === -1) return;
    const newSlots = [...slots];
    newSlots[i] = letter;
    setSlots(newSlots);
    setPool(pool.filter((l, idx) => !(l === letter && idx === pool.indexOf(letter))));
    if (newSlots.every((s, idx) => s === target[idx])) {
      markSolved(7);
      setTimeout(() => navigate({ to: "/door" }), 600);
    }
  }
  function reset() {
    setSlots([null, null, null, null, null]);
    setPool(["U", "H", "R", "T", "T"]);
  }
  const wrong = slots.every((s) => s !== null) && !slots.every((s, idx) => s === target[idx]);

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {slots.map((s, i) => (
          <div
            key={i}
            className={`flex h-14 w-14 items-center justify-center rounded border-2 font-display text-2xl ${
              s ? "border-gold bg-gold/10 text-gold" : "border-border bg-background/40"
            }`}
          >
            {s ?? ""}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 flex-wrap">
        {pool.map((l, i) => (
          <button
            key={i}
            onClick={() => place(l)}
            className="h-12 w-12 rounded border-2 border-gold/40 bg-background/40 font-display text-xl hover:bg-gold/10"
          >
            {l}
          </button>
        ))}
      </div>
      {wrong && (
        <div className="text-center">
          <p className="text-sm text-destructive">Pieces don't fit. Try again.</p>
          <Button variant="outline" size="sm" onClick={reset} className="mt-2">
            Reset shards
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Puzzle 8: Voices in the Wilderness ---------- */
function VoicesInWilderness() {
  const clips = [
    "Trust in the Lord, for He is your *BEEP*.",
    "Children, *BEEP* your father and mother.",
    "Without ceasing, *BEEP* for one another.",
  ];
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {clips.map((c, i) => (
          <div key={i} className="rounded border border-gold/30 bg-background/40 p-3">
            <div className="font-display text-xs uppercase tracking-widest text-gold">
              Voice {i + 1}
            </div>
            <p className="mt-1 italic">"{c}"</p>
            <audio controls className="mt-2 w-full max-w-sm">
              <source src="" />
            </audio>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Take the first letter of each censored word.
      </p>
      <AnswerForm puzzle={PUZZLES[7]} placeholder="3-letter code" />
    </div>
  );
}

/* ---------- Puzzle 9: Timeline ---------- */
type Event = { id: string; label: string; moses: boolean; order?: number };
function Timeline() {
  const all: Event[] = [
    { id: "basket", label: "Hidden in a basket", moses: true, order: 1 },
    { id: "babel", label: "Tower of Babel", moses: false },
    { id: "bush", label: "Burning Bush", moses: true, order: 2 },
    { id: "abraham", label: "Abraham's covenant", moses: false },
    { id: "plagues", label: "Ten Plagues", moses: true, order: 3 },
    { id: "redsea", label: "Crossing the Red Sea", moses: true, order: 4 },
    { id: "ten", label: "Ten Commandments", moses: true, order: 5 },
  ];
  const [removed, setRemoved] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const visible = all.filter((e) => !removed.includes(e.id) && !order.includes(e.id));

  function remove(id: string) {
    const e = all.find((x) => x.id === id)!;
    if (e.moses) {
      setError(`"${e.label}" belongs to Moses!`);
      return;
    }
    setError("");
    setRemoved([...removed, id]);
  }

  function pick(id: string) {
    const e = all.find((x) => x.id === id)!;
    if (!e.moses) {
      setError(`"${e.label}" doesn't belong. Remove it instead.`);
      return;
    }
    const expected = all.filter((x) => x.moses).sort((a, b) => a.order! - b.order!);
    if (expected[order.length].id !== id) {
      setError("Wrong order. Restart.");
      setOrder([]);
      return;
    }
    setError("");
    const next = [...order, id];
    setOrder(next);
    if (next.length === 5) {
      markSolved(9);
      setTimeout(() => navigate({ to: "/door" }), 600);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Tap to <strong className="text-gold">order</strong> Moses events. Tap ✕ to{" "}
        <strong className="text-destructive">remove</strong> imposters.
      </p>
      <div className="space-y-2">
        {visible.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded border border-border bg-background/40 p-3"
          >
            <button onClick={() => pick(e.id)} className="text-left flex-1 hover:text-gold">
              {e.label}
            </button>
            <button
              onClick={() => remove(e.id)}
              className="ml-2 text-destructive hover:text-destructive/80"
              aria-label="remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {order.length > 0 && (
        <div className="rounded border border-gold/30 p-3">
          <div className="font-display text-xs uppercase tracking-widest text-gold">Ordered</div>
          <ol className="mt-1 list-decimal list-inside text-sm">
            {order.map((id) => (
              <li key={id}>{all.find((x) => x.id === id)!.label}</li>
            ))}
          </ol>
        </div>
      )}
      {error && <div className="text-center text-sm text-destructive">{error}</div>}
    </div>
  );
}
