import { useRef, useState } from "react";
import { AnswerForm } from "./AnswerForm";
import { MultiQuestionRunner } from "./MultiQuestionRunner";
import type { HiddenScene as HiddenSceneT, Puzzle } from "@/game/content";

export function HiddenScene({ puzzle, scene }: { puzzle: Puzzle; scene: HiddenSceneT }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const allFound = scene.markers.length > 0 && found.length === scene.markers.length;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    // Aspect-correction: convert percentages to a common unit so radius is roughly circular
    // We use the smaller dimension as the unit (width for landscape, height for portrait).
    for (const m of scene.markers) {
      if (found.includes(m.id)) continue;
      // Compute distance in % of width using horizontal,
      // and in % of height for vertical, scaled by aspect ratio so radius is uniform.
      const aspect = rect.width / rect.height;
      const dx = px - m.x;
      const dy = (py - m.y) / aspect; // normalize y to x-units
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= m.radius) {
        setFound((f) => [...f, m.id]);
        return;
      }
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={ref}
        onClick={handleClick}
        className="relative w-full overflow-hidden rounded-lg border border-gold/30 cursor-crosshair select-none"
        style={{ aspectRatio: "16/9" }}
      >
        {scene.imageUrl ? (
          <img
            src={scene.imageUrl}
            alt="Hidden scene"
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-background/40 text-muted-foreground text-sm">
            No image set. Upload one in /admin.
          </div>
        )}
        {scene.markers.map((m) => {
          const isFound = found.includes(m.id);
          if (!isFound) return null;
          return (
            <span
              key={m.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center rounded-full h-12 w-12 md:h-14 md:w-14 text-2xl md:text-3xl bg-background/85 ring-2 ring-gold gold-glow animate-in zoom-in-50 duration-300"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              aria-label={m.label ?? m.id}
            >
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{m.emoji}</span>
            </span>
          );
        })}
      </div>
      <div className="text-center text-sm text-muted-foreground">
        Found {found.length} / {scene.markers.length} — click anywhere on the image
      </div>
      {allFound ? (
        puzzle.questions && puzzle.questions.length > 0 ? (
          <MultiQuestionRunner puzzle={puzzle} questions={puzzle.questions} />
        ) : (
          <AnswerForm puzzle={puzzle} placeholder={`What do all ${scene.markers.length} share?`} />
        )
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Find all symbols to unlock the answer field.
        </p>
      )}
    </div>
  );
}
