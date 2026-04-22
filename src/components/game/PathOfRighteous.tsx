import { useEffect, useState } from "react";
import { AnswerForm } from "./AnswerForm";
import { Button } from "@/components/ui/button";
import type { PathConfig, Puzzle } from "@/game/content";
import { PATH_RECALL_PENALTY_SECONDS, TRAP_PENALTY_SECONDS, safeColsForRow } from "@/game/content";
import { addPenalty } from "@/game/state";
import { playSfx } from "@/game/sfx";

export function PathOfRighteous({
  puzzle,
  config,
}: {
  puzzle: Puzzle;
  config: PathConfig;
}) {
  const { cols, rows, previewSeconds } = config;

  // Build a Set of safe (row*cols+col) indices, supporting multiple safe cols per row.
  const safeIndices = new Set<number>();
  for (let r = 0; r < rows; r++) {
    for (const c of safeColsForRow(config, r)) {
      safeIndices.add(r * cols + c);
    }
  }

  const [phase, setPhase] = useState<"ready" | "preview" | "play" | "recall" | "crossed" | "fail">("ready");
  const [step, setStep] = useState(0);
  const [trail, setTrail] = useState<number[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (phase !== "preview" && phase !== "recall") return;
    const t = setTimeout(() => setPhase("play"), previewSeconds * 1000);
    return () => clearTimeout(t);
  }, [phase, previewSeconds]);

  function revealPath() {
    if (phase === "ready") {
      setError("");
      setPhase("preview");
    }
  }

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
      playSfx("error");
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
    if (trail.includes(idx)) return; // already tapped this stone
    setError("");
    const newTrail = [...trail, idx];
    setTrail(newTrail);

    // Advance row only when every safe stone in the current row has been tapped.
    const safeInRow = safeColsForRow(config, row);
    const tappedInRow = safeInRow.filter((c) => newTrail.includes(row * cols + c));
    if (tappedInRow.length === safeInRow.length) {
      const nextRow = step + 1;
      setStep(nextRow);
      if (nextRow === rows) setPhase("crossed");
    }
  }

  const showSafe = phase === "preview" || phase === "recall";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {phase === "ready" && `When you're ready, reveal the safe path. It will show for ${previewSeconds}s.`}
          {phase === "preview" && `Memorize the path — hidden in ${previewSeconds}s.`}
          {phase === "recall" && `Path revealed — hides in ${previewSeconds}s.`}
          {phase === "play" && `Row ${step + 1} of ${rows}. Wrong stone = −30s.`}
          {phase === "fail" && "Reset…"}
          {phase === "crossed" && "You crossed safely. Now name the way."}
        </p>
        {phase === "ready" && (
          <Button type="button" size="sm" onClick={revealPath}>
            Reveal path ({previewSeconds}s)
          </Button>
        )}
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
        className={`mx-auto grid gap-[2px] ${phase === "fail" ? "pointer-events-none opacity-60" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `min(100%, ${Math.min(420, cols * 40)}px)`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const reached = trail.includes(i);
          const safe = safeIndices.has(i);
          const reveal = showSafe && safe;
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={phase !== "play"}
              className={`aspect-square rounded-sm border transition ${
                reached
                  ? "border-gold bg-gold/30"
                  : reveal
                    ? "border-gold bg-gold/40 shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                    : "border-border/40 bg-background/30 hover:border-gold/40"
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
