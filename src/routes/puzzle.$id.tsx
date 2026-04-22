import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPuzzle, getPuzzles, TRAP_PENALTY_SECONDS } from "@/game/content";
import { PuzzleShell } from "@/components/game/PuzzleShell";
import { AnswerForm } from "@/components/game/AnswerForm";
import { Button } from "@/components/ui/button";
import { addPenalty, isGameStarted, isUnlocked, markSolved } from "@/game/state";
import { HiddenScene } from "@/components/game/HiddenScene";
import { PathOfRighteous } from "@/components/game/PathOfRighteous";
import { MultiQuestionRunner } from "@/components/game/MultiQuestionRunner";
import cathedralMural from "@/assets/cathedral-mural.jpg";
import stainedGlass from "@/assets/stained-glass.jpg";

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
  const navigate = useNavigate();
  const numId = Number(id);
  const puzzle = getPuzzle(numId);

  useEffect(() => {
    if (!isGameStarted()) {
      navigate({ to: "/" });
      return;
    }
    if (!puzzle || !isUnlocked(numId)) {
      navigate({ to: "/door" });
    }
  }, [puzzle, numId, navigate]);

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

  // Helper: render a text puzzle as either a single AnswerForm or a multi-question runner.
  const textPuzzle = (placeholder: string, inputMode?: "text" | "numeric") => {
    if (puzzle.questions && puzzle.questions.length > 0) {
      return <MultiQuestionRunner puzzle={puzzle} questions={puzzle.questions} inputMode={inputMode} />;
    }
    return <AnswerForm puzzle={puzzle} placeholder={placeholder} inputMode={inputMode} />;
  };

  return (
    <PuzzleShell puzzle={puzzle}>
      {puzzle.id === 1 && textPuzzle("Type the missing word")}
      {puzzle.id === 2 && (
        <HiddenScene
          puzzle={puzzle}
          scene={{
            imageUrl: puzzle.hiddenScene?.imageUrl || cathedralMural,
            markers: puzzle.hiddenScene?.markers ?? [],
          }}
        />
      )}
      {puzzle.id === 3 && <Library />}
      {puzzle.id === 4 && puzzle.pathConfig && (
        <PathOfRighteous puzzle={puzzle} config={puzzle.pathConfig} />
      )}
      {puzzle.id === 5 && textPuzzle("Name the hymn")}
      {puzzle.id === 6 && textPuzzle("Enter a number", "numeric")}
      {puzzle.id === 7 && <StainedGlass />}
      {puzzle.id === 8 && <MusicRoundOrSingle />}
      {puzzle.id === 9 && <Timeline />}
    </PuzzleShell>
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

/* ---------- Puzzle 7: Broken Stained Glass ---------- */
function StainedGlass() {
  const puzzle = getPuzzles()[6];
  const letterMap: Record<number, string> = { 0: "T", 2: "R", 4: "U", 6: "T", 8: "H" };
  const initialOrder = [4, 7, 2, 5, 0, 8, 1, 6, 3];
  const [order, setOrder] = useState<number[]>(initialOrder);
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolvedLocal] = useState(false);

  function tap(gridIdx: number) {
    if (solved) return;
    if (selected === null) {
      setSelected(gridIdx);
      return;
    }
    if (selected === gridIdx) {
      setSelected(null);
      return;
    }
    const next = [...order];
    [next[selected], next[gridIdx]] = [next[gridIdx], next[selected]];
    setOrder(next);
    setSelected(null);
    if (next.every((piece, pos) => piece === pos)) {
      setSolvedLocal(true);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Tap two pieces to swap them. Reassemble the window — letters will appear.
      </p>
      <div
        className="relative mx-auto grid grid-cols-3 gap-1 rounded-lg overflow-hidden border border-gold/30 bg-background/40"
        style={{ maxWidth: 360, aspectRatio: "1/1" }}
      >
        {order.map((piece, gridIdx) => {
          const row = Math.floor(piece / 3);
          const col = piece % 3;
          const isSel = selected === gridIdx;
          const letter = letterMap[piece];
          return (
            <button
              key={gridIdx}
              onClick={() => tap(gridIdx)}
              className={`relative aspect-square overflow-hidden transition ${
                isSel ? "ring-4 ring-gold scale-95" : "hover:opacity-90"
              }`}
              style={{
                backgroundImage: `url(${stainedGlass})`,
                backgroundSize: "300% 300%",
                backgroundPosition: `${col * 50}% ${row * 50}%`,
              }}
              aria-label={`piece-${piece}`}
            >
              {solved && letter && (
                <span className="absolute inset-0 flex items-center justify-center font-display text-3xl text-gold drop-shadow-[0_0_8px_black]">
                  {letter}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {solved ? (
        puzzle.questions && puzzle.questions.length > 0 ? (
          <MultiQuestionRunner puzzle={puzzle} questions={puzzle.questions} />
        ) : (
          <>
            <p className="text-center text-sm text-gold">The window reveals a word.</p>
            <AnswerForm puzzle={puzzle} placeholder="Type the revealed word" />
          </>
        )
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Reassemble the window to reveal the answer.
        </p>
      )}
    </div>
  );
}

/* ---------- Puzzle 8: Music round (multi-question with audio) ---------- */
function MusicRoundOrSingle() {
  const puzzle = getPuzzles()[7];
  const questions = puzzle.questions ?? puzzle.musicQuestions ?? [];
  if (questions.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No music questions configured. Set them up in /admin.
      </p>
    );
  }
  return <MultiQuestionRunner puzzle={puzzle} questions={questions} showAudio />;
}

/* ---------- Puzzle 9: Timeline ---------- */
type Event = { id: string; label: string; moses: boolean; order?: number };
function Timeline() {
  const puzzle = getPuzzles()[8];
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
  const [done, setDone] = useState(false);

  const visible = all.filter((e) => !removed.includes(e.id) && !order.includes(e.id));

  function remove(id: string) {
    if (done) return;
    const e = all.find((x) => x.id === id)!;
    if (e.moses) {
      addPenalty(TRAP_PENALTY_SECONDS);
      setError(`"${e.label}" belongs to Moses! −30 seconds.`);
      return;
    }
    setError("");
    setRemoved([...removed, id]);
  }

  function pick(id: string) {
    if (done) return;
    const e = all.find((x) => x.id === id)!;
    if (!e.moses) {
      addPenalty(TRAP_PENALTY_SECONDS);
      setError(`"${e.label}" doesn't belong. −30 seconds.`);
      return;
    }
    const expected = all.filter((x) => x.moses).sort((a, b) => a.order! - b.order!);
    if (expected[order.length].id !== id) {
      addPenalty(TRAP_PENALTY_SECONDS);
      setError(`Out of order. −30 seconds.`);
      return;
    }
    setError("");
    const next = [...order, id];
    setOrder(next);
    if (next.length === 5) {
      setDone(true);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Tap to <strong className="text-gold">order</strong> Moses events. Tap ✕ to{" "}
        <strong className="text-destructive">remove</strong> imposters. Wrong moves = −30s.
      </p>
      <div className="space-y-2">
        {visible.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded border border-border bg-background/40 p-3"
          >
            <button onClick={() => pick(e.id)} className="text-left flex-1 hover:text-gold" disabled={done}>
              {e.label}
            </button>
            <button
              onClick={() => remove(e.id)}
              className="ml-2 text-destructive hover:text-destructive/80"
              aria-label="remove"
              disabled={done}
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
      {done && (
        <>
          <p className="text-center text-sm text-gold">Timeline complete. Type the order to lock it in.</p>
          <AnswerForm puzzle={puzzle} placeholder="Type: 12345" inputMode="numeric" />
        </>
      )}
    </div>
  );
}
// Suppress unused warning; Button is reused indirectly via children (kept import for parity)
void Button;
