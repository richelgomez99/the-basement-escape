import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Timer } from "@/components/game/Timer";
import { Button } from "@/components/ui/button";
import { PUZZLES, RECALL_PENALTY_SECONDS } from "@/game/content";
import {
  addPenalty,
  getTeamName,
  isGameStarted,
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

  useEffect(() => {
    if (!isGameStarted()) {
      navigate({ to: "/" });
      return;
    }
    setTeam(getTeamName());
  }, [navigate]);

  const allSolved = solved.length === PUZZLES.length;

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
            {solved.length} of {PUZZLES.length} locks opened
          </p>
        </div>

        <div className="mt-8 stone-panel rounded-2xl p-6 md:p-10">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {PUZZLES.map((p) => {
              const isSolved = solved.includes(p.id);
              return (
                <Link
                  key={p.id}
                  to="/puzzle/$id"
                  params={{ id: String(p.id) }}
                  className={`group relative aspect-square rounded-lg border-2 p-3 md:p-5 transition-all flex flex-col items-center justify-center text-center ${
                    isSolved
                      ? "border-gold bg-gold/10 gold-glow"
                      : "border-border bg-background/50 hover:border-gold/60 hover:bg-background/80"
                  }`}
                >
                  <LockIcon solved={isSolved} />
                  <div
                    className={`mt-2 font-display text-xs md:text-sm ${
                      isSolved ? "text-gold" : "text-muted-foreground"
                    }`}
                  >
                    Lock {p.id}
                  </div>
                  <div className="mt-1 text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                    {p.title.replace(/^.*— /, "")}
                  </div>
                </Link>
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

function LockIcon({ solved }: { solved: boolean }) {
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
