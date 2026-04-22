// Single source of truth for puzzle content. Edit values via /admin or here.
// Artifacts concatenated in puzzle order form the final vault code.

export const GAME_DURATION_SECONDS = 60 * 60; // 60 minutes
export const RECALL_PENALTY_SECONDS = 120; // 2 minutes — used for "show me again" on Path
export const TRAP_PENALTY_SECONDS = 30;
export const PATH_RECALL_PENALTY_SECONDS = 120; // 2 min for replaying the Path preview

export const ADMIN_DEFAULT_PASSWORD = "glorious2025";

export type Hint = { tier: 1 | 2 | 3; label: string; text: string };

// A generic single-question unit. Used for puzzles 1, 4, 5, 6, 7 multi-question mode
// and the music round (puzzle 8). Optional `audioUrl` for music questions.
export type Question = {
  prompt: string;
  hint?: string;
  answer: string;
  acceptable?: string[];
  audioUrl?: string; // optional MP3 (puzzle 8)
};
// Backwards-compat alias for old code
export type MusicQuestion = Question;

// Hidden-scene marker for puzzle 2
export type HiddenMarker = {
  id: string;
  emoji: string; // e.g. "🐟" or any text
  x: number; // 0-100 percent of image width
  y: number; // 0-100 percent of image height
  radius: number; // % of min(image width,height) — hit area
  label?: string; // accessible label
};
export type HiddenScene = {
  imageUrl: string; // public URL or imported asset src
  markers: HiddenMarker[];
};

// Path-of-righteous configuration
export type PathConfig = {
  cols: number;
  rows: number;
  // Length must equal `rows`. Each entry is the safe column index (0-based) for that row.
  safeCols: number[];
  previewSeconds: number; // initial flash time
};

export type Puzzle = {
  id: number;
  title: string;
  flavor: string;
  scripture?: string;
  artifact: string; // single character
  // Single-answer fallback (used when `questions` is empty/undefined for text puzzles)
  answer: string;
  acceptable?: string[];
  hints: Hint[];
  // NEW: multi-question mode for puzzles 1, 4, 5, 6, 7, 8
  questions?: Question[];
  // Music questions (legacy field for puzzle 8 — kept as alias of questions)
  musicQuestions?: Question[];
  // Puzzle 2 hidden scene
  hiddenScene?: HiddenScene;
  // Puzzle 4 path config
  pathConfig?: PathConfig;
};

// Default cathedral asset URL (resolved at runtime via dynamic import substitution).
// We store an empty string and the route fills it in with the bundled image.
const DEFAULT_CATHEDRAL = ""; // resolved in route via import

// Generate the default 9x6 zigzag path (15 steps)
function defaultPath(): PathConfig {
  // 9 cols, 6 rows = 6 stones per row but path advances row-by-row.
  // We extend by re-using rows: path is 15 steps, advancing one row each step but
  // wrapping back through the grid (rows 1..6 then 6..1 then 1..3 = 15).
  const rows = 15;
  const cols = 9;
  // Hand-tuned weaving columns for a memorable but tricky path of 15.
  const safeCols = [4, 5, 6, 5, 4, 3, 2, 3, 4, 5, 6, 7, 6, 5, 4];
  return { cols, rows, safeCols, previewSeconds: 5 };
}

export const DEFAULT_PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: "Warm-up — Fill in the Blank",
    flavor: "A scroll lies open on the lectern. One word has faded.",
    scripture:
      'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have ______ life. — John 3:16',
    artifact: "S",
    answer: "everlasting",
    acceptable: ["everlasting", "eternal"],
    hints: [
      { tier: 1, label: "Nudge", text: "It means 'without end.'" },
      { tier: 2, label: "Direction", text: "Eleven letters. Starts with E." },
      { tier: 3, label: "Bypass", text: "The answer is: everlasting" },
    ],
  },
  {
    id: 2,
    title: "Hidden in Plain Sight",
    flavor: "Five sacred symbols hide in the cathedral mural. Find them all, then name what they share.",
    scripture: "He who has eyes to see, let him see.",
    artifact: "A",
    answer: "light",
    acceptable: ["light", "the light"],
    hints: [
      { tier: 1, label: "Nudge", text: "Look near the windows, the altar, the floor — and shadows." },
      { tier: 2, label: "Direction", text: "Dove, fish, cross, lamb, bread. They are all illuminated." },
      { tier: 3, label: "Bypass", text: "The answer is: LIGHT" },
    ],
    hiddenScene: {
      imageUrl: DEFAULT_CATHEDRAL,
      markers: [
        { id: "dove", emoji: "🕊️", x: 50, y: 18, radius: 8, label: "dove" },
        { id: "fish", emoji: "🐟", x: 22, y: 78, radius: 8, label: "fish" },
        { id: "cross", emoji: "✝️", x: 50, y: 55, radius: 8, label: "cross" },
        { id: "lamb", emoji: "🐑", x: 78, y: 75, radius: 8, label: "lamb" },
        { id: "bread", emoji: "🍞", x: 50, y: 88, radius: 8, label: "bread" },
      ],
    },
  },
  {
    id: 3,
    title: "The Locked Library",
    flavor: "Place the first four books of the Bible in order. Beware imposters.",
    artifact: "L",
    answer: "4",
    hints: [
      { tier: 1, label: "Nudge", text: "Hezekiah and First Opinions are not books of the Bible." },
      { tier: 2, label: "Direction", text: "Genesis, Exodus, Leviticus, Numbers." },
      { tier: 3, label: "Bypass", text: "The number of correct books is 4." },
    ],
  },
  {
    id: 4,
    title: "Path of the Righteous",
    flavor:
      "The path is shown for a moment, then hidden. Cross row by row. A wrong stone costs 30 seconds. Asking to see the path again costs 2 minutes.",
    scripture: "Strait is the gate, and narrow is the way. — Matthew 7:14",
    artifact: "V",
    answer: "narrow",
    acceptable: ["narrow", "the narrow way", "narrow way"],
    hints: [
      { tier: 1, label: "Nudge", text: "It is not straight — it weaves." },
      { tier: 2, label: "Direction", text: "Use the 'Show path again' button (−2 min) if you forgot." },
      { tier: 3, label: "Bypass", text: "After crossing, the answer is: NARROW" },
    ],
    pathConfig: defaultPath(),
  },
  {
    id: 5,
    title: "Name That Tune",
    flavor: "A familiar hymn drifts through the crypt. Name it.",
    artifact: "A",
    answer: "amazing grace",
    acceptable: ["amazing grace"],
    hints: [
      { tier: 1, label: "Nudge", text: "Written by John Newton, a former slave trader." },
      { tier: 2, label: "Direction", text: "Two words. 'how sweet the sound...'" },
      { tier: 3, label: "Bypass", text: "The hymn is: Amazing Grace" },
    ],
  },
  {
    id: 6,
    title: "Faith by Numbers",
    flavor:
      "(Days of Noah's flood) − (apostles × Jonah's days in the fish). Type the resulting number.",
    scripture: '"And rain was upon the earth forty days and forty nights." — Genesis 7:12',
    artifact: "T",
    answer: "4",
    hints: [
      { tier: 1, label: "Nudge", text: "Recall how long Noah's flood lasted (40)." },
      { tier: 2, label: "Direction", text: "12 apostles × 3 days in the fish = 36. 40 − 36." },
      { tier: 3, label: "Bypass", text: "The answer is 4." },
    ],
  },
  {
    id: 7,
    title: "Broken Stained Glass",
    flavor: "Reassemble the shards. A word will appear — type it to claim the artifact.",
    artifact: "I",
    answer: "truth",
    hints: [
      { tier: 1, label: "Nudge", text: "Tap two pieces to swap them." },
      { tier: 2, label: "Direction", text: "'I am the way, the ____, and the life.' Five letters." },
      { tier: 3, label: "Bypass", text: "The word is: TRUTH" },
    ],
  },
  {
    id: 8,
    title: "Songs of the Saints",
    flavor: "Five gospel music challenges. Wrong answers cost 30 seconds. Pass them all.",
    artifact: "I",
    answer: "i",
    acceptable: ["i"],
    questions: [
      {
        prompt:
          "___ released by Donald Lawrence in 2004 samples ___ released by Michael Jackson in 2001. (Format: gospel song, MJ song)",
        hint: "Two parts. Separate with a comma.",
        answer: "healed, you rock my world",
        acceptable: [
          "healed, you rock my world",
          "healed and you rock my world",
          "healed / you rock my world",
          "healed - you rock my world",
        ],
        audioUrl: "",
      },
      {
        prompt: 'Finish the lyric: "Melodies from heaven, ___ ___ ___ ___."',
        hint: "Four words. It is also the title of the song.",
        answer: "rain down on me",
        acceptable: ["rain down on me"],
        audioUrl: "",
      },
      {
        prompt: 'What group released "Optimistic" in 1991?',
        hint: "Minneapolis-based gospel ensemble.",
        answer: "sounds of blackness",
        acceptable: ["sounds of blackness", "the sounds of blackness"],
        audioUrl: "",
      },
      {
        prompt: "10 seconds — name that song AND artist.",
        hint: 'Format: Song - Artist (e.g. "Praise Him in Advance - Marvin Sapp").',
        answer: "praise him in advance - marvin sapp",
        acceptable: [
          "praise him in advance - marvin sapp",
          "marvin sapp - praise him in advance",
          "praise him in advance, marvin sapp",
          "marvin sapp, praise him in advance",
        ],
        audioUrl: "",
      },
      {
        prompt: "10 seconds — name that song AND artist.",
        hint: "Hezekiah Walker classic. Format: Song - Artist.",
        answer: "wonderful is your name - hezekiah walker",
        acceptable: [
          "wonderful is your name - hezekiah walker",
          "hezekiah walker - wonderful is your name",
          "wonderful is your name, hezekiah walker",
          "hezekiah walker, wonderful is your name",
        ],
        audioUrl: "",
      },
    ],
    hints: [
      { tier: 1, label: "Nudge", text: "Each wrong guess costs 30 seconds — read carefully." },
      { tier: 2, label: "Direction", text: "Q1 is two songs (gospel + MJ). Q4/Q5 want both song and artist." },
      { tier: 3, label: "Bypass", text: "After all 5, the artifact letter is: I" },
    ],
  },
  {
    id: 9,
    title: "The Timeline",
    flavor:
      "Order the life of Moses. Remove any event that doesn't belong. Wrong moves cost 30 seconds.",
    artifact: "N",
    answer: "12345",
    hints: [
      { tier: 1, label: "Nudge", text: "Two events belong to Abraham or Babel — drop them." },
      { tier: 2, label: "Direction", text: "Basket → Burning Bush → Plagues → Red Sea → Ten Commandments." },
      { tier: 3, label: "Bypass", text: "Order: Basket, Burning Bush, Plagues, Red Sea, Ten Commandments." },
    ],
  },
];

// Mirror musicQuestions ↔ questions for puzzle 8 backwards-compat
DEFAULT_PUZZLES.forEach((p) => {
  if (p.id === 8 && p.questions && !p.musicQuestions) p.musicQuestions = p.questions;
});

/* ---------------- Persistence: Cloud + local fallback ---------------- */

const OVERRIDES_KEY = "be_content_overrides";
type Overrides = Partial<Record<number, Partial<Puzzle>>>;

let cachedOverrides: Overrides = {};
let loadedFromCloud = false;

function readLocal(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    const v = window.localStorage.getItem(OVERRIDES_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

function writeLocal(o: Overrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
}

// Initialize cache from local storage immediately so SSR/first render works.
if (typeof window !== "undefined") {
  cachedOverrides = readLocal();
}

export async function loadOverridesFromCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("puzzle_overrides")
      .select("data")
      .eq("key", "global")
      .maybeSingle();
    if (error) throw error;
    if (data?.data && typeof data.data === "object") {
      cachedOverrides = data.data as Overrides;
      writeLocal(cachedOverrides);
      loadedFromCloud = true;
      window.dispatchEvent(new Event("be_content"));
    }
  } catch (e) {
    // Fall back silently to local cache.
    console.warn("Cloud overrides load failed, using local cache:", e);
  }
}

export function isCloudLoaded() {
  return loadedFromCloud;
}

export async function saveOverridesToCloud(overrides: Overrides): Promise<void> {
  cachedOverrides = overrides;
  writeLocal(overrides);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("be_content"));
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase
      .from("puzzle_overrides")
      .upsert({ key: "global", data: overrides as any, updated_at: new Date().toISOString() });
    if (error) throw error;
  } catch (e) {
    console.warn("Cloud overrides save failed (kept local copy):", e);
    throw e;
  }
}

export function getPuzzles(): Puzzle[] {
  const overrides = cachedOverrides;
  return DEFAULT_PUZZLES.map((p) => {
    const o = overrides[p.id];
    if (!o) return p;
    const merged: Puzzle = { ...p, ...o, hints: o.hints ?? p.hints };
    // Mirror musicQuestions ↔ questions for puzzle 8
    if (p.id === 8) {
      if (merged.questions && !merged.musicQuestions) merged.musicQuestions = merged.questions;
      if (merged.musicQuestions && !merged.questions) merged.questions = merged.musicQuestions;
    }
    return merged;
  });
}

export function getPuzzle(id: number): Puzzle | undefined {
  return getPuzzles().find((p) => p.id === id);
}

// Legacy sync save kept for backward-compat — also fires cloud save in background.
export function saveOverrides(overrides: Overrides) {
  cachedOverrides = overrides;
  writeLocal(overrides);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("be_content"));
  saveOverridesToCloud(overrides).catch(() => {});
}

export function getOverrides(): Overrides {
  return cachedOverrides;
}

export function clearOverrides() {
  cachedOverrides = {};
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(OVERRIDES_KEY);
    window.dispatchEvent(new Event("be_content"));
  }
  saveOverridesToCloud({}).catch(() => {});
}

export function getVaultCode(): string {
  return getPuzzles()
    .map((p) => p.artifact)
    .join("");
}

// Backwards-compatible exports
export const PUZZLES = DEFAULT_PUZZLES;
export const VAULT_CODE = DEFAULT_PUZZLES.map((p) => p.artifact).join("");

export const KEY_VERSE =
  '"And ye shall know the truth, and the truth shall make you free." — John 8:32';
