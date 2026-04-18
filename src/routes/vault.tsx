import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Timer } from "@/components/game/Timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PUZZLES, VAULT_CODE } from "@/game/content";
import { setFinished } from "@/game/state";

export const Route = createFileRoute("/vault")({
  head: () => ({ meta: [{ title: "The Final Vault — The Basement Escape" }] }),
  component: Vault,
});

function Vault() {
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().toUpperCase() === VAULT_CODE.toUpperCase()) {
      setFinished(true);
      navigate({ to: "/victory" });
    } else {
      setShake(true);
      setError("The vault holds firm. Check your artifacts.");
      setTimeout(() => setShake(false), 450);
    }
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link to="/door">
          <Button variant="outline" size="sm" className="border-gold/40">
            ← Back to Door
          </Button>
        </Link>
        <Timer />
      </header>

      <main className="mx-auto mt-12 max-w-2xl text-center">
        <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
          Lock 10 of 10
        </div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">The Final Vault</h1>
        <p className="mt-3 text-muted-foreground">
          Combine your nine artifacts in the order they were earned.
        </p>

        <div className="stone-panel mt-8 rounded-xl p-6">
          <div className="grid grid-cols-9 gap-2">
            {PUZZLES.map((p) => (
              <div
                key={p.id}
                className="aspect-square rounded border border-gold/30 bg-background/40 flex items-center justify-center font-display text-lg text-gold"
              >
                {p.artifact}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            (Your collected artifacts in order. Type them below.)
          </p>

          <form onSubmit={submit} className={`mt-6 space-y-3 ${shake ? "shake" : ""}`}>
            <Input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={9}
              placeholder="9-character code"
              className="h-14 text-center text-2xl font-display tracking-[0.4em] border-gold/40 bg-background/60"
            />
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button
              type="submit"
              className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest"
            >
              UNLOCK THE VAULT
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
