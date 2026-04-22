import { useEffect, useState } from "react";
import { AnswerForm } from "./AnswerForm";
import { Button } from "@/components/ui/button";
import type { PathConfig, Puzzle } from "@/game/content";
import { PATH_RECALL_PENALTY_SECONDS, TRAP_PENALTY_SECONDS } from "@/game/content";
import { addPenalty } from "@/game/state";

export function PathOfRighteous({
  puzzle,
  config,
}: {
  puzzle: Puzzle;
  config: PathConfig;
}) {
  const { cols, rows, safeCols, previewSeconds } = config;
  const safeIndices = new Set(safeCols.map((c, r) => r * cols + c));

  // 'preview' | 'memorize' | 'play' | 'recall' | 'crossed' | 'fail-flash'
  const [phase, setPhase] = useState<"preview" | "play" | "recall" | "crossed" | "fail">("preview");
  const [step, setStep] = useState(0);
  const [trail, setTrail] = useState<number[]>([]);
  const [error, setError] = useState("");

  // Initial preview countdown
  useEffect(() => {
    if (phase !== "preview") return;
    const t = setTimeout(() => setPhase("play"), previewSeconds * 1000);
    return () => clearTimeout(t);
  }, [phase, previewSeconds]);

  // Recall mini-preview
  useEffect(() => {
    if (phase !== "recall") return;
    const t = setTimeout(() => setPhase("play"), previewSeconds * 1000);
    return () => clearTimeout(t);
  }, [phase, previewSeconds]);

  function showAgain() {
    if (phase !== "play") return;
    addPenalty(PATH_RECALL_PENALTY_SECONDS);
    setError("Path revealed — −2 minutes.");
    setPhase("recall");
  }

  function tap(idx: number) {
    if (phase !== "play") return;
    const row = Math.floor(idx / cols);
    if (row !== step) {
      setError("Step in order, row by row.");
      return;
    }
    if (!safeIndices.has(idx)) {
      addPenalty(TRAP_PENALTY_SECONDS);
      setError("The stone crumbles! −30 seconds.");
      setPhase("fail");
      setTimeout(() => {
        setStep(0);
        setTrail([]);
        setError("");
        setPhase("play");
      }, 1200);
      return;
    }
    setError("");
    const next = step + 1;
    setStep(next);
    setTrail([...trail, idx]);
    if (next === rows) setPhase("crossed");
  }

  const showSafe = phase === "preview" || phase === "recall";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {phase === "preview" && `Memorize the path — hidden in ${previewSeconds}s.`}
          {phase === "recall" && `Path revealed — hides in ${previewSeconds}s.`}
          {phase === "play" && `Row ${step + 1} of ${rows}. Wrong stone = −30s.`}
          {phase === "fail" && "Reset…"}
          {phase === "crossed" && "You crossed safely. Now name the way."}
        </p>
        {phase === "play" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={showAgain}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            Show path again (−2 min)
          </Button>
        )}
      </div>

      <div
        className={`mx-auto grid gap-1 ${phase === "fail" ? "pointer-events-none opacity-60" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: Math.min(560, cols * 56),
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const reached = trail.includes(i);
          const safe = safeIndices.has(i);
          const reveal = showSafe && safe;
          const currentRowMarker =
            phase === "play" && Math.floor(i / cols) === step && i % cols === 0;
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={phase !== "play"}
              className={`aspect-square rounded border transition ${
                reached
                  ? "border-gold bg-gold/30"
                  : reveal
                    ? "border-gold bg-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.6)]"
                    : currentRowMarker
                      ? "border-gold/60 bg-background/40"
                      : "border-border/50 bg-background/30 hover:border-gold/40"
              }`}
              aria-label={`stone-${i}`}
            />
          );
        })}
      </div>

      {error && <div className="text-center text-sm text-destructive">{error}</div>}
      {phase === "crossed" && (
        <AnswerForm puzzle={puzzle} placeholder="The way is ______" />
      )}
    </div>
  );
}
