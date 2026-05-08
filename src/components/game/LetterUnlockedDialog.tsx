import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shown when a player solves a puzzle (or recalls/replays a solved one).
 * Reveals the artifact letter so they can write it down for the final vault.
 */
export function LetterUnlockedDialog({
  open,
  onClose,
  puzzleId,
  totalPuzzles,
  letter,
  variant = "solved", // "solved" | "recall" | "replay"
  onContinue,
  continueLabel,
}: {
  open: boolean;
  onClose: () => void;
  puzzleId: number;
  totalPuzzles: number;
  letter: string;
  variant?: "solved" | "recall" | "replay";
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const headline =
    variant === "solved"
      ? `Lock ${puzzleId} opened!`
      : variant === "recall"
        ? `Recalled — Lock ${puzzleId}`
        : `Lock ${puzzleId} — letter`;

  const sub =
    variant === "solved"
      ? "A letter for the final word."
      : variant === "recall"
        ? "The Oracle reveals the letter you'd already earned."
        : "The letter you earned.";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold">{headline}</DialogTitle>
          <DialogDescription>{sub}</DialogDescription>
        </DialogHeader>

        <div className="my-2 flex flex-col items-center gap-2">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Letter #{puzzleId} of {totalPuzzles}
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-xl border-2 border-gold bg-gold/10 font-display text-7xl text-gold gold-glow">
            {letter || "?"}
          </div>
        </div>

        <DialogFooter>
          <Button
            className="bg-gold text-gold-foreground hover:bg-gold/90 w-full"
            onClick={() => {
              onClose();
              onContinue?.();
            }}
          >
            {continueLabel ?? "Got it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
