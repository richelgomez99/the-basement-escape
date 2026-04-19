
# Bug Fixes + Sequential Locks + Admin Page + Art

## 1. Sequential locks (Door)
- Lock N is clickable only when locks 1…N-1 are all in `solved`.
- Locked-but-not-yet-available locks render with a chain icon and are not Links.
- Direct nav to `/puzzle/$id` for an unavailable puzzle redirects to `/door`.

## 2. Bug sweep — full game flow
Audit and fix:
- Vault: ensure `VAULT_CODE` matches actual artifacts (`E L 4 I G 4 T H 5` → "EL4IG4TH5"); verify case-insensitive compare; on success → `/victory` and mark finished; wrong → shake.
- Timer: when `remaining` hits 0 anywhere, redirect to `/failure` (currently no enforcement). Add a global watcher in `__root.tsx` or in `useCountdown`.
- Victory/Failure: handle direct visits without crashing; show final time / team name.
- Reset: clear ALL keys (incl. content overrides should be separate); confirm destructive action.
- Hint Bypass tier should NOT auto-solve — it just reveals the answer; player still types it. Confirm current behavior matches.
- Puzzle 4 trap penalty: confirm `TRAP_PENALTY_SECONDS` actually fires somewhere (currently puzzle 4 is just a text input — no grid). Either implement the grid or drop the "wrong step" copy. **Decision:** keep text input for v1 reliability; soften flavor copy.
- Puzzle pages: guard against unknown id (404 component).
- localStorage SSR safety on all reads.
- Title screen: prevent starting a new game if one is already in progress without confirmation.

## 3. Admin page (`/admin`)
- Password gate: prompt for a password, compared against a value stored in `localStorage` under `be_admin_pw` (set on first visit, or via env-style constant). Default password: `glorious2025` (host can change via the page).
- Editor: form per puzzle with fields title, flavor, scripture, artifact (1 char), answer, acceptable (comma list), and 3 hints (label + text).
- Edits saved to `localStorage` as `be_content_overrides` and merged on top of `PUZZLES` via a `getPuzzles()` accessor used everywhere (replace direct `PUZZLES` imports).
- "Reset to defaults" button per puzzle and globally.
- "Export JSON" / "Import JSON" so host can back up content.
- Show derived `VAULT_CODE` live as artifacts change.

## 4. Generated art
- Cathedral mural for Puzzle 2 (5 hidden symbols visible enough to find).
- Stained-glass window for Puzzle 7.
- Use as background art on those puzzle screens (decorative; mechanic remains the existing answer input — no clickable hotspots in v1, since admin can change the answer).

## 5. Out of scope (explicitly)
- No backend / cloud sync.
- No live hidden-symbol click mechanic or drag-shard mechanic — text-answer model stays so the admin can change everything.
- No leaderboard.
