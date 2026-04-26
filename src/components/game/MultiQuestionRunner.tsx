import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Puzzle, Question } from "@/game/content";
import { TRAP_PENALTY_SECONDS, getPuzzles } from "@/game/content";
import { addPenalty, getPuzzleState, markSolved, setPuzzleState } from "@/game/state";
import { playSfx } from "@/game/sfx";
import { LetterUnlockedDialog } from "./LetterUnlockedDialog";
import { HintBox } from "./HintBox";
import { ClipAudio } from "./ClipAudio";

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.!?'"]/g, "")
    .replace(/\s+/g, " ");
}

function splitParts(s: string): string[] {
  return normalize(s)
    .split(/\s*(?:-|–|—|,|\/|&| by | and )\s*/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

function isCorrect(input: string, q: Question) {
  const n = normalize(input);
  const canonical = normalize(q.answer);
  if (n === canonical) return true;
  if ((q.acceptable ?? []).some((a) => normalize(a) === n)) return true;

  const inputParts = splitParts(input).sort();
  const candidates = [q.answer, ...(q.acceptable ?? [])];
  for (const c of candidates) {
    const cParts = splitParts(c).sort();
    if (cParts.length >= 2 && cParts.length === inputParts.length) {
      if (cParts.every((p, i) => p === inputParts[i])) return true;
    }
  }
  return false;
}

export function MultiQuestionRunner({
  puzzle,
  questions,
  showAudio = false,
  inputMode,
}: {
  puzzle: Puzzle;
  questions: Question[];
  showAudio?: boolean;
  inputMode?: "text" | "numeric";
}) {
  const [idx, setIdx] = useState(() => {
    const saved = getPuzzleState<{ idx: number }>(puzzle.id, { idx: 0 });
    return Math.min(Math.max(0, saved.idx ?? 0), Math.max(0, questions.length - 1));
  });
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const navigate = useNavigate();
  const totalPuzzles = getPuzzles().length;

  useEffect(() => {
    setPuzzleState(puzzle.id, { idx });
  }, [puzzle.id, idx]);

  const current = questions[idx];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    if (!isCorrect(val, current)) {
      playSfx("error");
      addPenalty(TRAP_PENALTY_SECONDS);
      setError("Not quite. −30 seconds.");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    setError("");
    setVal("");
    if (idx + 1 >= questions.length) {
      playSfx("lock");
      markSolved(puzzle.id);
      setShowLetter(true);
    } else {
      setIdx(idx + 1);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Question {idx + 1} of {questions.length}
        </span>
        <span className="text-destructive">Wrong answer = −30s</span>
      </div>

      <div className="rounded border border-gold/30 bg-background/40 p-4 space-y-3">
        {current.scripture && (
          <blockquote className="border-l-2 border-gold/60 pl-3 text-sm italic text-foreground/90">
            {current.scripture}
          </blockquote>
        )}
        <p className="font-display text-lg">{current.prompt}</p>
        {showAudio && current.audioRole !== "hint2" && current.audioUrl && (
          <ClipAudio
            key={current.audioUrl}
            src={current.audioUrl}
            startSec={current.audioStartSec}
            endSec={current.audioEndSec}
            className="w-full"
          />
        )}
        {showAudio && current.audioRole !== "hint2" && !current.audioUrl && (
          <p className="text-xs italic text-muted-foreground">
            (No audio uploaded yet — host can add one in /admin)
          </p>
        )}
      </div>

      {(() => {
        const qHints = (current.hints ?? []).filter((h) => h.text.trim());
        const fallback = (puzzle.hints ?? []).filter((h) => h.text.trim());
        let hintsToShow = qHints.length > 0 ? qHints : fallback;
        // If this question's audio is meant to live on the second hint, attach it.
        if (showAudio && current.audioRole === "hint2" && current.audioUrl) {
          hintsToShow = hintsToShow.map((h) =>
            h.tier === 2
              ? {
                  ...h,
                  audioUrl: current.audioUrl,
                  audioStartSec: current.audioStartSec,
                  audioEndSec: current.audioEndSec,
                }
              : h,
          );
        }
        if (hintsToShow.length === 0) {
          return current.hint ? (
            <p className="text-xs text-muted-foreground italic">{current.hint}</p>
          ) : null;
        }
        return <HintBox key={`q-${idx}`} hints={hintsToShow as typeof hintsToShow} />;
      })()}

      <form onSubmit={submit} className={`space-y-3 ${shake ? "shake" : ""}`}>
        <Input
          autoFocus
          value={val}
          inputMode={inputMode}
          onChange={(e) => {
            setVal(e.target.value);
            setError("");
          }}
          placeholder="Your answer"
          className="h-12 text-lg border-gold/40 bg-background/60"
        />
        {error && <div className="text-sm text-destructive">{error}</div>}
        <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
          {idx + 1 >= questions.length ? "Submit final answer" : "Next"}
        </Button>
      </form>

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
