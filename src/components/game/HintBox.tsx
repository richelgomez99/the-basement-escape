import { useState } from "react";
import type { Hint } from "@/game/content";
import { Button } from "@/components/ui/button";

export function HintBox({ hints }: { hints: Hint[] }) {
  const [revealed, setRevealed] = useState<number>(0);
  return (
    <div className="stone-panel rounded-lg p-4">
      <div className="mb-3 font-display text-sm uppercase tracking-widest text-gold">
        Hints
      </div>
      <div className="space-y-2">
        {hints.slice(0, revealed).map((h) => (
          <div key={h.tier} className="rounded border border-border bg-background/40 p-3 text-sm">
            <span className="font-display text-gold mr-2">{h.label}:</span>
            {h.text}
          </div>
        ))}
        {revealed < hints.length && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealed((r) => r + 1)}
            className="border-gold/50 text-gold hover:bg-gold/10"
          >
            Reveal {hints[revealed].label}
          </Button>
        )}
      </div>
    </div>
  );
}
