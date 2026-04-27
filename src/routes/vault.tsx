import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Timer } from "@/components/game/Timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPuzzles, getVaultCode, RECALL_PENALTY_SECONDS } from "@/game/content";
import { addPenalty, getSolved, isGameStarted, setFinished } from "@/game/state";
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

type Slot = { letter: string; sourceIdx: number } | null;

function Vault() {
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [wrongLetters, setWrongLetters] = useState<Set<number>>(new Set());
  const [showHelper, setShowHelper] = useState(true);
  const navigate = useNavigate();
  const puzzles = getPuzzles();

  // Pool: scrambled letters the team has earned (one per lock)
  const pool = useMemo(
    () =>
      puzzles
        .map((p, i) => ({ letter: (p.artifact || "?").toUpperCase(), sourceIdx: i, lockId: p.id }))
        .sort(() => 0), // keep deterministic order = lock order; user rearranges below
    [puzzles],
  );

  const wordLength = puzzles.length;
  const [slots, setSlots] = useState<Slot[]>(() => Array(wordLength).fill(null));

  // Track which pool indices are currently placed
  const placedSourceIdx = useMemo(
    () => new Set(slots.filter(Boolean).map((s) => s!.sourceIdx)),
    [slots],
  );

  useEffect(() => {
    if (!isGameStarted()) {
      navigate({ to: "/" });
      return;
    }
    if (getSolved().length < puzzles.length) {
      navigate({ to: "/door" });
    }
  }, [navigate, puzzles.length]);

  // Sync helper word into the input whenever helper changes
  useEffect(() => {
    if (!showHelper) return;
    const next = slots.map((s) => (s ? s.letter : "")).join("");
    setCode(next);
    setError("");
  }, [slots, showHelper]);

  function placeLetter(sourceIdx: number, letter: string) {
    if (placedSourceIdx.has(sourceIdx)) return;
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty === -1) return;
    const next = [...slots];
    next[firstEmpty] = { letter, sourceIdx };
    setSlots(next);
  }

  function removeFromSlot(slotIdx: number) {
    const next = [...slots];
    next[slotIdx] = null;
    setSlots(next);
  }

  function clearHelper() {
    setSlots(Array(wordLength).fill(null));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const guess = code.trim().toUpperCase();
    if (guess === getVaultCode().toUpperCase()) {
      setFinished(true, "victory");
      navigate({ to: "/victory" });
      return;
    }
    setShake(true);
    setError("The vault holds firm. The wrong letters glow red — try again.");
    setTimeout(() => setShake(false), 450);

    // Mark which letters in the helper slots are wrong (compared positionally to the answer)
    if (showHelper) {
      const answer = getVaultCode().toUpperCase();
      const wrong = new Set<number>();
      slots.forEach((s, i) => {
        if (!s) return;
        if (answer[i] !== s.letter) wrong.add(i);
      });
      setWrongLetters(wrong);
    } else {
      setWrongLetters(new Set());
    }
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
          You hold {wordLength} letters — one earned from each lock. Rearrange them to spell the
          sacred {wordLength}-letter word.
        </p>

        <div className="stone-panel mt-6 rounded-xl p-6 space-y-6">
          {/* Toggle: use the interactive helper, or jump straight to typing */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowHelper(true);
                setWrongLetters(new Set());
              }}
              className={`rounded px-3 py-1 border ${
                showHelper
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-gold/30 text-muted-foreground hover:bg-gold/5"
              }`}
            >
              Use letter board
            </button>
            <button
              type="button"
              onClick={() => {
                setShowHelper(false);
                setWrongLetters(new Set());
                setCode("");
              }}
              className={`rounded px-3 py-1 border ${
                !showHelper
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-gold/30 text-muted-foreground hover:bg-gold/5"
              }`}
            >
              I know it — just let me type
            </button>
          </div>

          {showHelper ? (
            <>
              {/* How-to */}
              <div className="rounded border border-gold/20 bg-background/40 p-3 text-left text-xs text-muted-foreground">
                <div className="font-display text-gold/90 uppercase tracking-widest text-[11px] mb-1">
                  How to use the letter board
                </div>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>
                    Tap a letter from the <strong>pool</strong> below to drop it into the next empty
                    slot above.
                  </li>
                  <li>Tap a slot to send that letter back to the pool.</li>
                  <li>
                    Submit when the slots spell a real {wordLength}-letter word. Wrong-position
                    letters will glow <span className="text-destructive">red</span>.
                  </li>
                </ol>
              </div>

              {/* Slots — the answer being built */}
              <div>
                <div className="font-display text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Your word
                </div>
                <div className={`flex justify-center gap-2 flex-wrap ${shake ? "shake" : ""}`}>
                  {slots.map((s, i) => {
                    const isWrong = wrongLetters.has(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => removeFromSlot(i)}
                        className={`h-14 w-12 rounded-md border-2 font-display text-2xl transition-colors ${
                          s
                            ? isWrong
                              ? "border-destructive bg-destructive/15 text-destructive"
                              : "border-gold bg-gold/10 text-gold hover:bg-gold/20"
                            : "border-dashed border-gold/30 bg-background/40 text-muted-foreground/40"
                        }`}
                        aria-label={s ? `Remove ${s.letter}` : `Empty slot ${i + 1}`}
                      >
                        {s ? s.letter : "_"}
                      </button>
                    );
                  })}
                </div>
                {slots.some(Boolean) && (
                  <button
                    type="button"
                    onClick={clearHelper}
                    className="mt-2 text-xs text-muted-foreground hover:text-gold underline"
                  >
                    Clear board
                  </button>
                )}
              </div>

              {/* Pool — the earned letters, labeled by lock */}
              <div>
                <div className="font-display text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Letters you've earned
                </div>
                <div className="grid grid-cols-9 gap-2">
                  {pool.map((p) => {
                    const used = placedSourceIdx.has(p.sourceIdx);
                    return (
                      <button
                        key={p.sourceIdx}
                        type="button"
                        disabled={used}
                        onClick={() => placeLetter(p.sourceIdx, p.letter)}
                        className={`aspect-square rounded border flex flex-col items-center justify-center transition-all ${
                          used
                            ? "border-gold/10 bg-background/20 opacity-30"
                            : "border-gold/40 bg-background/60 hover:bg-gold/15 hover:border-gold"
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
                          {p.lockId}
                        </div>
                        <div className="font-display text-xl text-gold">{p.letter}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            // Direct-type mode: empty input, no letter scaffolding
            <div className="rounded border border-gold/20 bg-background/40 p-3 text-left text-xs text-muted-foreground">
              You're flying solo — type the {wordLength}-letter word straight into the vault.
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <Input
              value={code}
              readOnly={showHelper}
              onChange={(e) => {
                if (showHelper) return;
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={wordLength}
              placeholder={
                showHelper ? "Build your word above…" : `The ${wordLength}-letter word`
              }
              className="h-14 text-center text-2xl font-display tracking-[0.4em] border-gold/40 bg-background/60"
            />
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button
              type="submit"
              className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest"
            >
              UNLOCK THE VAULT
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
