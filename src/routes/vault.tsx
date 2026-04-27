import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Timer } from "@/components/game/Timer";
import { Button } from "@/components/ui/button";
import { getPuzzles, getVaultCode, RECALL_PENALTY_SECONDS } from "@/game/content";
import { addPenalty, getSolved, isGameStarted, resumeClock, setFinished } from "@/game/state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LetterUnlockedDialog } from "@/components/game/LetterUnlockedDialog";

export const Route = createFileRoute("/vault")({
  head: () => ({ meta: [{ title: "The Final Vault — The Basement Escape" }] }),
  component: Vault,
});

function Vault() {
  const puzzles = getPuzzles();
  const wordLength = puzzles.length;
  const [letters, setLetters] = useState<string[]>(() => Array(wordLength).fill(""));
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [wrongPositions, setWrongPositions] = useState<Set<number>>(new Set());
  const [recallOpen, setRecallOpen] = useState(false);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const navigate = useNavigate();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isGameStarted()) {
      navigate({ to: "/" });
      return;
    }
    if (getSolved().length < puzzles.length) {
      navigate({ to: "/door" });
    }
  }, [navigate, puzzles.length]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function focusBox(i: number) {
    const el = inputsRef.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  }

  function setLetterAt(i: number, ch: string) {
    setError("");
    setWrongPositions(new Set());
    const cleaned = ch.toUpperCase().replace(/[^A-Z]/g, "");
    const next = [...letters];
    if (cleaned.length === 0) {
      next[i] = "";
      setLetters(next);
      return;
    }
    // Allow paste of multi-char into one box: spread across slots.
    let idx = i;
    for (const c of cleaned) {
      if (idx >= wordLength) break;
      next[idx] = c;
      idx++;
    }
    setLetters(next);
    if (idx < wordLength) focusBox(idx);
    else inputsRef.current[wordLength - 1]?.blur();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (letters[i]) {
        // Clear current box; stay here.
        const next = [...letters];
        next[i] = "";
        setLetters(next);
        e.preventDefault();
      } else if (i > 0) {
        // Empty box → move back and clear that one.
        const next = [...letters];
        next[i - 1] = "";
        setLetters(next);
        focusBox(i - 1);
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusBox(i - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" && i < wordLength - 1) {
      focusBox(i + 1);
      e.preventDefault();
    } else if (e.key === "Enter") {
      submit();
      e.preventDefault();
    }
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const guess = letters.join("").toUpperCase();
    const answer = getVaultCode().toUpperCase();
    if (guess.length < wordLength) {
      setError(`Fill all ${wordLength} boxes before submitting.`);
      return;
    }
    if (guess === answer) {
      setFinished(true, "victory");
      navigate({ to: "/victory" });
      return;
    }
    setShake(true);
    setError("The vault holds firm. Wrong letters glow red — fix them and try again.");
    const wrong = new Set<number>();
    for (let i = 0; i < wordLength; i++) {
      if ((guess[i] || "") !== answer[i]) wrong.add(i);
    }
    setWrongPositions(wrong);
    setTimeout(() => setShake(false), 450);
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link to="/door">
          <Button variant="outline" size="sm" className="border-gold/40">
            ← Back to Door
          </Button>
        </Link>
        <Timer />
      </header>

      <main className="mx-auto mt-12 max-w-2xl text-center">
        <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
          Lock 10 of 10
        </div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">The Final Vault</h1>
        <p className="mt-3 text-muted-foreground">
          Each lock you cracked gave you a single letter. Rearrange those letters into one{" "}
          {wordLength}-letter word and{" "}
          <strong className="text-gold">type one letter into each box below</strong>.
        </p>

        <div className="stone-panel mt-8 rounded-xl p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="font-display text-[11px] uppercase tracking-widest text-gold">
              Type the {wordLength}-letter word — one letter per box
            </div>

            <div
              className={`flex justify-center gap-2 flex-wrap ${shake ? "shake" : ""}`}
              role="group"
              aria-label="Vault answer"
            >
              {letters.map((ch, i) => {
                const isWrong = wrongPositions.has(i);
                return (
                  <input
                    key={i}
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={1}
                    value={ch}
                    onChange={(e) => setLetterAt(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-label={`Letter ${i + 1} of ${wordLength}`}
                    className={`h-14 w-12 rounded-md border-2 bg-background/60 text-center font-display text-2xl uppercase outline-none transition-colors focus:ring-2 focus:ring-gold/60 ${
                      isWrong
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : ch
                          ? "border-gold text-gold"
                          : "border-gold/40 text-foreground"
                    }`}
                  />
                );
              })}
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <Button
              type="submit"
              className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest"
            >
              UNLOCK THE VAULT
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gold/10 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setRecallOpen(true)}
            >
              Forgot a letter? Recall (−2:00)
            </Button>
            <Link to="/door">
              <Button variant="outline" size="sm" className="border-gold/40">
                Replay a lock for free
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Dialog open={recallOpen} onOpenChange={setRecallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recall a letter</DialogTitle>
            <DialogDescription>
              Pick a lock — the Oracle reveals its letter for{" "}
              <strong className="text-destructive">−2 minutes</strong>. Or close this and head back
              to the Door to replay any solved lock for free.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-2">
            {puzzles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  addPenalty(RECALL_PENALTY_SECONDS);
                  setRecallOpen(false);
                  setRevealedId(p.id);
                }}
                className="rounded border border-gold/50 bg-gold/5 p-3 text-center hover:bg-gold/15"
              >
                <div className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                  Lock {p.id}
                </div>
                <div className="mt-1 font-display text-xl text-gold">?</div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecallOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(() => {
        const revealedPuzzle = revealedId ? puzzles.find((p) => p.id === revealedId) : null;
        if (!revealedPuzzle) return null;
        return (
          <LetterUnlockedDialog
            open={revealedId !== null}
            onClose={() => setRevealedId(null)}
            puzzleId={revealedPuzzle.id}
            totalPuzzles={puzzles.length}
            letter={revealedPuzzle.artifact}
            variant="recall"
          />
        );
      })()}
    </div>
  );
}
