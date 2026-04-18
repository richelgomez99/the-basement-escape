import { Link } from "@tanstack/react-router";
import { Timer } from "./Timer";
import { HintBox } from "./HintBox";
import type { Puzzle } from "@/game/content";
import { Button } from "@/components/ui/button";

export function PuzzleShell({
  puzzle,
  children,
}: {
  puzzle: Puzzle;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <header className="mx-auto flex max-w-4xl items-center justify-between">
        <Link to="/door">
          <Button variant="outline" size="sm" className="border-gold/40">
            ← Back to Door
          </Button>
        </Link>
        <Timer />
      </header>

      <main className="mx-auto mt-8 max-w-3xl space-y-6">
        <div className="text-center">
          <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
            Lock {puzzle.id} of 9
          </div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">{puzzle.title}</h1>
          <p className="mt-3 text-muted-foreground italic">{puzzle.flavor}</p>
          {puzzle.scripture && (
            <p className="mt-3 font-display text-sm text-gold/90">"{puzzle.scripture}"</p>
          )}
        </div>

        <div className="stone-panel rounded-xl p-6">{children}</div>

        <HintBox hints={puzzle.hints} />
      </main>
    </div>
  );
}

export function checkAnswer(input: string, puzzle: Puzzle): boolean {
  const norm = input.trim().toLowerCase();
  if (norm === puzzle.answer.toLowerCase()) return true;
  if (puzzle.acceptable?.some((a) => a.toLowerCase() === norm)) return true;
  return false;
}
