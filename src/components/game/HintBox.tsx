import { useState } from "react";
import type { Hint } from "@/game/content";
import { Button } from "@/components/ui/button";
import { addPenalty } from "@/game/state";

const HINT_PENALTY_SECONDS = 120; // 2 minutes per hint reveal

export function HintBox({ hints }: { hints: Hint[] }) {
  const [revealed, setRevealed] = useState<number>(0);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="stone-panel rounded-lg p-4">
      <div className="mb-3 font-display text-sm uppercase tracking-widest text-gold">
        Hints{" "}
        <span className="text-[10px] text-muted-foreground normal-case tracking-normal">
          (−2 min each)
        </span>
      </div>
      <div className="space-y-2">
        {hints.slice(0, revealed).map((h) => (
          <div key={h.tier} className="rounded border border-border bg-background/40 p-3 text-sm space-y-2">
            <div>
              <span className="font-display text-gold mr-2">{h.label}:</span>
              {h.text}
            </div>
            {h.audioUrl && (
              <audio controls className="w-full" src={h.audioUrl} />
            )}
          </div>
        ))}
        {revealed < hints.length &&
          (confirming ? (
            <div className="rounded border border-gold/40 bg-background/40 p-3 text-sm space-y-2">
              <div>
                Reveal <span className="text-gold">{hints[revealed].label}</span>? This adds{" "}
                <span className="text-gold">2 minutes</span> to your time.
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-gold text-background hover:bg-gold/90"
                  onClick={() => {
                    addPenalty(HINT_PENALTY_SECONDS);
                    setRevealed((r) => r + 1);
                    setConfirming(false);
                  }}
                >
                  Yes, take the penalty
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(true)}
              className="border-gold/50 text-gold hover:bg-gold/10"
            >
              Reveal {hints[revealed].label} (−2 min)
            </Button>
          ))}
      </div>
    </div>
  );
}
