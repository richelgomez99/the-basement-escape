import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkAnswer } from "./PuzzleShell";
import type { Puzzle } from "@/game/content";
import { markSolved } from "@/game/state";

export function AnswerForm({
  puzzle,
  placeholder = "Your answer",
  inputMode,
  onSolved,
}: {
  puzzle: Puzzle;
  placeholder?: string;
  inputMode?: "text" | "numeric";
  onSolved?: () => void;
}) {
  const [val, setVal] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (checkAnswer(val, puzzle)) {
      markSolved(puzzle.id);
      onSolved?.();
      navigate({ to: "/door" });
    } else {
      setShake(true);
      setError("Not quite. Try again.");
      setTimeout(() => setShake(false), 450);
    }
  }

  return (
    <form onSubmit={submit} className={`space-y-3 ${shake ? "shake" : ""}`}>
      <Input
        autoFocus
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          setError("");
        }}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-12 text-lg border-gold/40 bg-background/60"
      />
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
        Submit
      </Button>
    </form>
  );
}
