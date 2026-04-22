import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Timer } from "@/components/game/Timer";
import { Button } from "@/components/ui/button";
import { getPuzzles, RECALL_PENALTY_SECONDS } from "@/game/content";
import {
  addPenalty,
  getTeamName,
  isGameStarted,
  resetGame,
  useCountdown,
} from "@/game/state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/door")({
  head: () => ({
    meta: [{ title: "The Door — The Basement Escape" }],
  }),
  component: DoorScreen,
});

function DoorScreen() {
  const navigate = useNavigate();
  const { solved } = useCountdown();
  const [team, setTeam] = useState("");
  const [recallOpen, setRecallOpen] = useState(false);
  const puzzles = getPuzzles();

  useEffect(() => {
    if (!isGameStarted()) {
      navigate({ to: "/" });
      return;
    }
    setTeam(getTeamName());
  }, [navigate]);

  const allSolved = solved.length === puzzles.length;
  const solvedSet = new Set(solved);
  // Sequential availability: lock N available iff 1..N-1 all solved.
  function isAvailable(id: number) {
    for (let i = 1; i < id; i++) if (!solvedSet.has(i)) return false;
    return true;
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <div>
          <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">Team</div>
          <div className="font-display text-xl">{team}</div>
        </div>
        <Timer />
      </header>

      <main className="mx-auto mt-8 max-w-5xl">
        <div className="text-center">
          <h1 className="font-display text-3xl md:text-5xl">The Door</h1>
          <p className="mt-2 text-muted-foreground">
            {solved.length} of {puzzles.length} locks opened
          </p>
        </div>

        <div className="mt-8 stone-panel rounded-2xl p-6 md:p-10">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {puzzles.map((p) => {
              const isSolved = solvedSet.has(p.id);
              const available = isAvailable(p.id);

              const tile = (
                <div
                  className={`group relative aspect-square rounded-lg border-2 p-3 md:p-5 transition-all flex flex-col items-center justify-center text-center ${
                    isSolved
                      ? "border-gold bg-gold/10 gold-glow"
                      : available
                        ? "border-border bg-background/50 hover:border-gold/60 hover:bg-background/80 cursor-pointer"
                        : "border-border/40 bg-background/20 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <LockIcon solved={isSolved} chained={!available && !isSolved} />
                  <div
                    className={`mt-2 font-display text-xs md:text-sm ${
                      isSolved
                        ? "text-gold"
                        : available
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    Lock {p.id}
                  </div>
                  <div
                    className={`mt-1 text-[10px] md:text-xs line-clamp-2 ${
                      available ? "text-muted-foreground" : "text-muted-foreground/50"
                    }`}
                  >
                    {available || isSolved ? p.title.replace(/^.*— /, "") : "Sealed"}
                  </div>
                </div>
              );

              return available ? (
                <Link key={p.id} to="/puzzle/$id" params={{ id: String(p.id) }}>
                  {tile}
                </Link>
              ) : (
                <div key={p.id} aria-disabled="true" title="Solve previous locks first">
                  {tile}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => setRecallOpen(true)}
          >
            Recall Past Clue (−2:00)
          </Button>

          {allSolved ? (
            <Link to="/vault">
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest h-12 px-8">
                APPROACH THE VAULT
              </Button>
            </Link>
          ) : (
            <div className="text-sm text-muted-foreground">
              Open all locks to reveal the vault.
            </div>
          )}
        </div>
      </main>

      <Dialog open={recallOpen} onOpenChange={setRecallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recall a past clue?</DialogTitle>
            <DialogDescription>
              The Oracle will repeat any clue you've already heard — but it will cost you{" "}
              <strong className="text-destructive">2 minutes</strong> off the clock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecallOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                addPenalty(RECALL_PENALTY_SECONDS);
                setRecallOpen(false);
              }}
            >
              Yes, recall (−2:00)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LockIcon({ solved, chained }: { solved: boolean; chained?: boolean }) {
  if (chained) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/60"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="7" cy="9" r="3" />
        <circle cx="13" cy="14" r="3" />
        <circle cx="19" cy="9" r="3" />
        <path d="M9.5 10.5l1.5 1.5M15.5 15.5l1.5-1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-8 w-8 md:h-10 md:w-10 ${solved ? "text-gold" : "text-muted-foreground"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {solved ? (
        <>
          <path d="M7 11V8a5 5 0 0 1 9.9-1" strokeLinecap="round" />
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M7 11V8a5 5 0 0 1 10 0v3" strokeLinecap="round" />
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
