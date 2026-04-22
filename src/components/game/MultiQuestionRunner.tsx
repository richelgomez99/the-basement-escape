import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Puzzle, Question } from "@/game/content";
import { TRAP_PENALTY_SECONDS } from "@/game/content";
import { addPenalty, markSolved } from "@/game/state";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(input: string, q: Question) {
  const n = normalize(input);
  if (n === normalize(q.answer)) return true;
  return (q.acceptable ?? []).some((a) => normalize(a) === n);
}

/**
 * Runs a list of questions sequentially. 30s penalty per wrong answer.
 * On the final correct answer, marks the puzzle solved and routes to /door.
 */
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
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const current = questions[idx];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    if (!isCorrect(val, current)) {
      addPenalty(TRAP_PENALTY_SECONDS);
      setError("Not quite. −30 seconds.");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    setError("");
    setVal("");
    if (idx + 1 >= questions.length) {
      markSolved(puzzle.id);
      navigate({ to: "/door" });
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
        <p className="font-display text-lg">{current.prompt}</p>
        {showAudio && current.audioUrl && (
          <audio key={current.audioUrl} controls className="w-full" src={current.audioUrl} />
        )}
        {showAudio && !current.audioUrl && (
          <p className="text-xs italic text-muted-foreground">
            (No audio uploaded yet — host can add one in /admin)
          </p>
        )}
        {current.hint && (
          <p className="text-xs text-muted-foreground italic">{current.hint}</p>
        )}
      </div>

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
    </div>
  );
}
