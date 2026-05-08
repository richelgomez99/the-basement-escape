import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPuzzle, getPuzzles, TRAP_PENALTY_SECONDS } from "@/game/content";
import { PuzzleShell } from "@/components/game/PuzzleShell";
import { AnswerForm } from "@/components/game/AnswerForm";
import { Button } from "@/components/ui/button";
import {
  addPenalty,
  getPuzzleState,
  getSolved,
  isGameStarted,
  isUnlocked,
  markSolved,
  setPuzzleState,
} from "@/game/state";
import { playSfx } from "@/game/sfx";
import { HiddenScene } from "@/components/game/HiddenScene";
import { PathOfRighteous } from "@/components/game/PathOfRighteous";
import { MultiQuestionRunner } from "@/components/game/MultiQuestionRunner";
import { LetterUnlockedDialog } from "@/components/game/LetterUnlockedDialog";
import { HintBox } from "@/components/game/HintBox";
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
  const totalPuzzles = getPuzzles().length;
  const [showLetter, setShowLetter] = useState(false);
  const [confirmRecall, setConfirmRecall] = useState(false);
  const alreadySolved = getSolved().includes(numId);
  const RECALL_PENALTY_SECONDS = 120;

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

  const textPuzzle = (placeholder: string, inputMode?: "text" | "numeric") => {
    if (puzzle.questions && puzzle.questions.length > 0) {
      return <MultiQuestionRunner puzzle={puzzle} questions={puzzle.questions} inputMode={inputMode} />;
    }
    return <AnswerForm puzzle={puzzle} placeholder={placeholder} inputMode={inputMode} />;
  };

  return (
    <PuzzleShell puzzle={puzzle}>
      {alreadySolved && (
        <div className="mb-4 rounded border border-gold/40 bg-gold/5 p-3 text-sm space-y-2">
          <div className="text-gold">
            ✓ You've already opened this lock. The letter is hidden — recall it for a penalty, or replay the puzzle below to see it again for free.
          </div>
          {confirmRecall ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Reveal letter? Adds <span className="text-gold">2 minutes</span> to your time.
              </span>
              <Button
                size="sm"
                className="bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => {
                  addPenalty(RECALL_PENALTY_SECONDS);
                  setConfirmRecall(false);
                  setShowLetter(true);
                }}
              >
                Yes, take −2 min
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmRecall(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10"
              onClick={() => setConfirmRecall(true)}
            >
              Recall letter (−2 min)
            </Button>
          )}
        </div>
      )}


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

      <LetterUnlockedDialog
        open={showLetter}
        onClose={() => setShowLetter(false)}
        puzzleId={puzzle.id}
        totalPuzzles={totalPuzzles}
        letter={puzzle.artifact}
        variant="replay"
      />
    </PuzzleShell>
  );
}

/* ---------- Puzzle 3: Locked Library ---------- */
function Library() {
  const puzzle = getPuzzles().find((p) => p.id === 3)!;
  const totalPuzzles = getPuzzles().length;
  const cfg = puzzle.libraryConfig;
  const books = cfg?.books ?? [];
  const [picked, setPicked] = useState<string[]>(() =>
    getPuzzleState<{ picked: string[] }>(3, { picked: [] }).picked ?? [],
  );
  const [error, setError] = useState("");
  const [showLetter, setShowLetter] = useState(false);
  const navigate = useNavigate();

  const realOrdered = books
    .filter((b) => b.real && typeof b.order === "number")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  useEffect(() => {
    setPuzzleState(3, { picked });
  }, [picked]);

  function pick(id: string) {
    const b = books.find((x) => x.id === id);
    if (!b) return;
    if (!b.real) {
      playSfx("error");
      addPenalty(TRAP_PENALTY_SECONDS);
      setError(`"${b.name}" is not a book of the Bible. −30s.`);
      return;
    }
    if (picked.includes(id)) return;
    const next = [...picked, id];
    if (realOrdered[next.length - 1]?.id !== id) {
      playSfx("error");
      addPenalty(TRAP_PENALTY_SECONDS);
      setError("Wrong order. Start over with the first book. −30s.");
      setPicked([]);
      return;
    }
    setError("");
    setPicked(next);
    if (next.length === realOrdered.length) {
      playSfx("lock");
      markSolved(3);
      setTimeout(() => setShowLetter(true), 400);
    }
  }

  if (books.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No books configured. Set them up in /admin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        {cfg?.intro ?? "Click books in correct biblical order. Decoys will sound the alarm."}
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

      <LetterUnlockedDialog
        open={showLetter}
        onClose={() => setShowLetter(false)}
        puzzleId={puzzle.id}
        totalPuzzles={totalPuzzles}
        letter={puzzle.artifact}
        variant="solved"
        continueLabel="Continue to the door"
        onContinue={() => navigate({ to: "/door" })}
      />
    </div>
  );
}

/* ---------- Puzzle 7: Broken Stained Glass ---------- */
function StainedGlass() {
  const puzzle = getPuzzles().find((p) => p.id === 7)!;
  const cfg = puzzle.stainedGlassConfig;
  const letters = cfg?.letters ?? ["", "", "", "", "", "", "", "", ""];
  const imageUrl = cfg?.imageUrl?.trim() ? cfg.imageUrl : stainedGlass;
  const initialOrder = [4, 7, 2, 5, 0, 8, 1, 6, 3];
  const saved = getPuzzleState<{ order: number[] }>(7, { order: initialOrder });
  const startOrder = Array.isArray(saved.order) && saved.order.length === 9 ? saved.order : initialOrder;
  const [order, setOrder] = useState<number[]>(startOrder);
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolvedLocal] = useState(() => startOrder.every((p, i) => p === i));

  useEffect(() => {
    setPuzzleState(7, { order });
  }, [order]);

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
        {cfg?.intro ?? "Tap two pieces to swap them. Reassemble the window — letters will appear."}
      </p>
      <div
        className="relative mx-auto grid grid-cols-3 gap-1 rounded-lg overflow-hidden border border-gold/30 bg-background/40"
        style={{ maxWidth: 360, aspectRatio: "1/1" }}
      >
        {order.map((piece, gridIdx) => {
          const row = Math.floor(piece / 3);
          const col = piece % 3;
          const isSel = selected === gridIdx;
          const letter = letters[piece] ?? "";
          return (
            <button
              key={gridIdx}
              onClick={() => tap(gridIdx)}
              className={`relative aspect-square overflow-hidden transition ${
                isSel ? "ring-4 ring-gold scale-95" : "hover:opacity-90"
              }`}
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "300% 300%",
                backgroundPosition: `${col * 50}% ${row * 50}%`,
              }}
              aria-label={`piece-${piece}`}
            >
              {solved && letter && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex items-center justify-center h-12 w-12 rounded-full bg-background/85 ring-2 ring-gold gold-glow font-display text-3xl text-gold">
                    {letter}
                  </span>
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
            <p className="text-center text-sm text-gold">
              The window reveals a word — read the letters and type it below.
            </p>
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
  const puzzle = getPuzzles().find((p) => p.id === 8)!;
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
function Timeline() {
  const puzzle = getPuzzles().find((p) => p.id === 9)!;
  const cfg = puzzle.timelineConfig;
  const all = cfg?.events ?? [];
  const finalCode = cfg?.finalCode ?? puzzle.answer ?? "";
  const ordered = all
    .filter((e) => e.belongs && typeof e.order === "number")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const savedT = getPuzzleState<{ removed: string[]; order: string[] }>(9, {
    removed: [],
    order: [],
  });
  const [removed, setRemoved] = useState<string[]>(savedT.removed ?? []);
  const [order, setOrder] = useState<string[]>(savedT.order ?? []);
  const [error, setError] = useState("");
  const [done, setDone] = useState(
    () => (savedT.order?.length ?? 0) === ordered.length && ordered.length > 0,
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setPuzzleState(9, { removed, order });
  }, [removed, order]);

  const visible = all.filter((e) => !removed.includes(e.id) && !order.includes(e.id));
  const confirmEvent = confirmId ? all.find((x) => x.id === confirmId) ?? null : null;

  function doRemove(id: string) {
    const e = all.find((x) => x.id === id);
    if (!e) return;
    if (e.belongs) {
      playSfx("error");
      addPenalty(TRAP_PENALTY_SECONDS);
      setError(`"${e.label}" belongs to the sequence! −30 seconds.`);
      return;
    }
    setError("");
    setRemoved((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function pick(id: string) {
    if (done) return;
    const e = all.find((x) => x.id === id);
    if (!e) return;
    if (!e.belongs) {
      playSfx("error");
      addPenalty(TRAP_PENALTY_SECONDS);
      setError(`"${e.label}" doesn't belong. −30 seconds.`);
      return;
    }
    if (ordered[order.length]?.id !== id) {
      playSfx("error");
      addPenalty(TRAP_PENALTY_SECONDS);
      setError(`Out of order. −30 seconds.`);
      return;
    }
    setError("");
    const next = [...order, id];
    setOrder(next);
    if (next.length === ordered.length) {
      setDone(true);
    }
  }

  if (all.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No timeline events configured. Set them up in /admin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        {cfg?.intro ?? "Tap to ORDER events. Tap ✕ to REMOVE imposters. Wrong moves = −30s."}
      </p>
      <div className="space-y-2">
        {visible.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded border border-border bg-background/40 p-3"
          >
            <button
              onClick={() => pick(e.id)}
              className="text-left flex-1 hover:text-gold"
              disabled={done}
            >
              {e.label}
            </button>
            <button
              onClick={() => setConfirmId(e.id)}
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
              <li key={id}>{all.find((x) => x.id === id)?.label}</li>
            ))}
          </ol>
        </div>
      )}
      {error && <div className="text-center text-sm text-destructive">{error}</div>}
      {done && (
        <>
          <p className="text-center text-sm text-gold">
            Timeline complete. Type{" "}
            {finalCode ? <code className="text-gold">{finalCode}</code> : "the order"} to lock it in.
          </p>
          <AnswerForm
            puzzle={puzzle}
            placeholder={finalCode ? `Type: ${finalCode}` : "Type the order"}
            inputMode="numeric"
          />
        </>
      )}

      {confirmId !== null && confirmEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-gold/40 bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg text-gold">Remove this event?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You're about to remove{" "}
              <strong className="text-foreground">"{confirmEvent.label}"</strong> from the board.
              If it actually belongs to the sequence, you'll lose{" "}
              <strong className="text-destructive">30 seconds</strong>. Are you sure?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-destructive/60 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  const id = confirmId;
                  setConfirmId(null);
                  if (id) doRemove(id);
                }}
              >
                Yes, remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Suppress unused warning; Button is reused indirectly via children (kept import for parity)
void Button;
