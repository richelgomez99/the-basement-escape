
# The Basement Escape — Build Plan

A single-browser, 60-minute virtual escape room for youth event teams. Each team plays in one shared browser (one screen-shares in their Zoom breakout). State persists in `localStorage` so a refresh doesn't kill progress.

## Visual Direction
- **Aesthetic:** Dark stone basement crypt with stained-glass accents — sacred meets modern escape-room app.
- **Palette:** Deep COGIC purple (`#3b1d5e` / royal) + antique gold (`#d4af37`) accents, candlelight warm whites on near-black stone backgrounds.
- **Type:** Serif display (Cinzel-style) for door/lock labels and scripture; clean sans (Inter) for puzzle UI and timer.
- **Feel:** Heavy textures on the door/locks, glowing gold when a lock opens, subtle flicker on candle elements. Slick and modern under the hood — fast, responsive, not a haunted-house parody.

## Routes
- `/` — Title screen: "The Basement Escape", team-name input, "Begin" button (starts the master 60:00 clock and stores start time).
- `/door` — **The Hub.** The heavy wooden door with 9 distinct locks, master countdown, "Recall Past Clue" button (-2:00 penalty with confirmation), team name. Click any unlocked lock → go to that puzzle. Locks turn gold + glow when solved.
- `/puzzle/1` … `/puzzle/9` — One route per puzzle (see below).
- `/vault` — Puzzle 10, the Final Vault: enter the 9 collected artifacts in sequence to win.
- `/victory` — End screen with final time and the Key Verse.
- `/failure` — Time-up screen with debrief prompt.

## The 9 Puzzles (mechanics, all with placeholder Christian-themed content)
1. **Warm-up — Fill in the Blank:** John 3:16 with "everlasting" missing. Text input. Artifact: letter `E`.
2. **Hidden in Plain Sight:** AI-generated cathedral scene; click 5 hidden symbols (dove, fish, cross, lamb, bread). Letters unscramble to a word. Artifact: a letter.
3. **Locked Library:** Click books in correct biblical order (Genesis → Exodus → Leviticus → Numbers) among decoys (Hezekiah, First Opinions). Artifact: a number.
4. **Path of the Righteous:** 4×3 stone grid; follow cryptic directions to find the safe path. Wrong stone = 30s lockout overlay. Artifact: a letter.
5. **Name That Tune:** 5-second audio snippet of a well-known gospel song; type title. Artifact: a letter.
6. **Faith by Numbers:** Word problem riddle ("Days of flood − Apostles × Jonah's days"). Numeric input. Artifact: a digit.
7. **Broken Stained Glass:** Drag-and-drop puzzle pieces; reveals hidden word. Artifact: a letter.
8. **Voices in the Wilderness:** 3 audio clips with a *BEEP* over one word; first letters of the 3 words form the code. Artifact: a letter.
9. **The Timeline:** Drag/select Moses events (remove Abraham decoys), order them. Answer: `3145`. Artifact: a digit.
10. **The Final Vault:** 9-character input combining all artifacts → unlocks victory verse.

Each puzzle screen has: scripture/flavor header, the puzzle interface, an answer input/submit, a 3-tier hint disclosure (Nudge → Direction → Bypass — these are visible to players, matching the doc's scripted hint structure), and a "Back to Door" button.

## Core Mechanics
- **Master timer:** Started on `/`, persisted as `startTime` + `penaltySeconds` in localStorage. Counts down from 60:00 across all routes. Hits 0 → redirect `/failure`.
- **Recall Past Clue penalty:** Adds 120s to `penaltySeconds`; confirmation modal so it isn't tapped by accident.
- **Lock state:** `solvedPuzzles: number[]` in localStorage. Door re-renders locks open/closed on every visit. Refresh-safe.
- **Artifact collection:** Each solve stores its artifact char; vault input checks the concatenated string.
- **Wrong-answer feedback:** Shake + "Try again" — no penalty (penalties only via Recall button and Puzzle 4 trap).
- **Reset:** A small "Reset game" link on `/` for the host between teams.

## Content Strategy
All puzzle answers, hints, scriptures, and artifacts live in a single `src/game/content.ts` config file with sensible Christian placeholders so the game is fully playable on day one. Leadership can swap any string (verse, song, decoy book, hint wording, final verse) by editing this one file — no component changes needed.

## Out of Scope (v1)
- No backend, no accounts, no realtime sync, no host dashboard, no leaderboard.
- AI-generated images for Puzzles 2 and 7 will use tasteful placeholder art the user can replace; audio for Puzzles 5 and 8 will be silent placeholder `<audio>` tags with a visible "Replace this clip" note (browsers can't generate real gospel audio).

## Deliverables
- Fully playable 10-puzzle escape room at the routes above.
- Single content config file for easy editing.
- COGIC purple + gold themed dark UI.
- localStorage persistence, master clock, penalty mechanic, all 10 puzzle mechanics implemented.
