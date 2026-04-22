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
// `safeCols[row]` may be a single column index (number) OR an array of column indices
// when the admin wants multiple valid stones per row (e.g. looping/branching paths).
export type PathConfig = {
  cols: number;
  rows: number;
  // Length must equal `rows`. Each entry is one or more safe column indices (0-based).
  safeCols: Array<number | number[]>;
  previewSeconds: number; // initial flash time
};

// Helper: return the set of safe column indices for a given row, regardless of shape.
export function safeColsForRow(cfg: PathConfig, row: number): number[] {
  const v = cfg.safeCols[row];
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

// Library (puzzle 3): list of books, real ones must be picked in order
export type LibraryBook = {
  id: string;
  name: string;
  real: boolean;
  order?: number; // 1-based order among real books
};
export type LibraryConfig = {
  books: LibraryBook[];
  intro?: string;
};

// Stained Glass (puzzle 7): 3x3 jigsaw with letters revealed when solved
export type StainedGlassConfig = {
  imageUrl: string; // background image (sliced into 3x3)
  // Letters keyed by piece index 0..8 (left-to-right, top-to-bottom of the SOLVED image).
  // Empty string = no letter shown on that piece.
  letters: string[]; // length 9
  revealedWord: string; // for display copy after solve
  intro?: string;
};

// Timeline (puzzle 9): events to order; some are imposters
export type TimelineEvent = {
  id: string;
  label: string;
  belongs: boolean; // true = part of the correct sequence
  order?: number; // 1-based among belongs=true
};
export type TimelineConfig = {
  events: TimelineEvent[];
  intro?: string;
  finalCode: string; // what to type to lock it (e.g. "12345")
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
  // Puzzle 3 library config
  libraryConfig?: LibraryConfig;
  // Puzzle 7 stained glass config
  stainedGlassConfig?: StainedGlassConfig;
  // Puzzle 9 timeline config
  timelineConfig?: TimelineConfig;
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
  const safeCols: Array<number | number[]> = [4, 5, 6, 5, 4, 3, 2, 3, 4, 5, 6, 7, 6, 5, 4];
  return { cols, rows, safeCols, previewSeconds: 12 };
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
      { tier: 1, label: "Nudge", text: "What kind of life does God promise those who believe? Think of a word that means it never ends." },
      { tier: 2, label: "Direction", text: "Eleven letters. A synonym for 'eternal' that begins with the same letter as 'every.'" },
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
      { tier: 1, label: "Nudge", text: "What do a stained-glass window, a candle on the altar, and the dove of the Spirit all carry?" },
      { tier: 2, label: "Direction", text: "Five letters. Matthew 5:16 — 'Let your ___ so shine before men.'" },
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
      { tier: 1, label: "Nudge", text: "Recite the very first books of the Old Testament — the Torah." },
      { tier: 2, label: "Direction", text: "There are four. The first is about beginnings; the second about leaving Egypt; one is priestly law; one is a wilderness census." },
      { tier: 3, label: "Bypass", text: "Genesis, Exodus, Leviticus, Numbers — that's 4 correct books." },
    ],
    libraryConfig: {
      intro: "Click books in correct biblical order. Decoys will sound the alarm.",
      books: [
        { id: "genesis", name: "Genesis", real: true, order: 1 },
        { id: "hezekiah", name: "Hezekiah", real: false },
        { id: "exodus", name: "Exodus", real: true, order: 2 },
        { id: "opinions", name: "First Opinions", real: false },
        { id: "leviticus", name: "Leviticus", real: true, order: 3 },
        { id: "numbers", name: "Numbers", real: true, order: 4 },
        { id: "melchizedek", name: "Melchizedek", real: false },
      ],
    },
  },
  {
    id: 4,
    title: "Path of the Righteous",
    flavor:
      "The path is shown for a moment, then hidden. Cross row by row. A wrong stone costs 30 seconds. Asking to see the path again costs 2 minutes.",
    scripture: "Strait is the gate, and ______ is the way. — Matthew 7:14",
    artifact: "V",
    answer: "narrow",
    acceptable: ["narrow", "the narrow way", "narrow way"],
    hints: [
      { tier: 1, label: "Nudge", text: "Jesus said few find this kind of way — it's the opposite of broad." },
      { tier: 2, label: "Direction", text: "Six letters. The opposite of 'wide.'" },
      { tier: 3, label: "Bypass", text: "The missing word from Matthew 7:14 is: narrow" },
    ],
    pathConfig: defaultPath(),
  },
  {
    id: 5,
    title: "Name That Tune",
    flavor: "A familiar gospel hymn drifts through the crypt. Name it.",
    artifact: "A",
    answer: "total praise",
    acceptable: ["total praise", "total praise to you"],
    hints: [
      { tier: 1, label: "Nudge", text: "A modern gospel standard composed by Richard Smallwood, often sung at funerals and church anniversaries." },
      { tier: 2, label: "Direction", text: "Two words. Adapts Psalm 121 ('I will lift mine eyes...') and famously closes on a long, sustained 'Amen.'" },
      { tier: 3, label: "Bypass", text: "The hymn is: Total Praise" },
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
      { tier: 1, label: "Nudge", text: "Start with how long it rained on Noah, then subtract a smaller number tied to the apostles and Jonah." },
      { tier: 2, label: "Direction", text: "Flood days − (apostles × Jonah's days in the fish). All three numbers are famous Bible counts." },
      { tier: 3, label: "Bypass", text: "40 − (12 × 3) = 4." },
    ],
  },
  {
    id: 7,
    title: "Broken Stained Glass",
    flavor: "Reassemble the shards. A word will appear — type it to claim the artifact.",
    artifact: "O",
    answer: "truth",
    hints: [
      { tier: 1, label: "Nudge", text: "Jesus made an 'I am' statement in John 14:6. Three things — and you're looking for the middle one." },
      { tier: 2, label: "Direction", text: "'I am the way, the ____, and the life.' Five letters, starts with T." },
      { tier: 3, label: "Bypass", text: "The word is: TRUTH" },
    ],
    stainedGlassConfig: {
      imageUrl: "", // resolved at runtime to the bundled stained-glass asset
      // Pieces are 0..8 in solved-image order. Letters spell TRUTH on pieces 0,2,4,6,8.
      letters: ["T", "", "R", "", "U", "", "T", "", "H"],
      revealedWord: "TRUTH",
      intro: "Tap two pieces to swap them. Reassemble the window — letters will appear.",
    },
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
          "___ released by Donald Lawrence in 2004 samples ___ released by Michael Jackson in 2001.",
        hint: "The gospel song's title is what God does for the brokenhearted (Psalm 147:3). The MJ track is from Invincible.",
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
        hint: "Kirk Franklin & God's Property, 1997. The four missing words describe what those melodies do.",
        answer: "rain down on me",
        acceptable: ["rain down on me"],
        audioUrl: "",
      },
      {
        prompt: 'What group released "Optimistic" in 1991?',
        hint: "A Minneapolis-based ensemble whose name pairs an audio word with a community.",
        answer: "sounds of blackness",
        acceptable: ["sounds of blackness", "the sounds of blackness"],
        audioUrl: "",
      },
      {
        prompt:
          'Name the song AND the artist. Type both, in any order, separated by a dash, comma, or "by". (e.g. "Song - Artist", "Artist, Song", or "Song by Artist")',
        hint: "Pastor and gospel artist who sang about lifting hands before the breakthrough arrives.",
        answer: "praise him in advance - marvin sapp",
        acceptable: [
          "praise him in advance - marvin sapp",
          "marvin sapp - praise him in advance",
          "praise him in advance, marvin sapp",
          "marvin sapp, praise him in advance",
          "praise him in advance by marvin sapp",
        ],
        audioUrl: "",
      },
      {
        prompt:
          'Name the song AND the artist. Type both, in any order, separated by a dash, comma, or "by". (e.g. "Song - Artist", "Artist, Song", or "Song by Artist")',
        hint: "Bishop and Love Fellowship Choir leader. The song declares that God's name is ___.",
        answer: "wonderful is your name - hezekiah walker",
        acceptable: [
          "wonderful is your name - hezekiah walker",
          "hezekiah walker - wonderful is your name",
          "wonderful is your name, hezekiah walker",
          "hezekiah walker, wonderful is your name",
          "wonderful is your name by hezekiah walker",
        ],
        audioUrl: "",
      },
    ],
    hints: [
      { tier: 1, label: "Nudge", text: "Most answers are gospel staples from the 90s and early 2000s. Think Kirk Franklin, Donald Lawrence, Marvin Sapp, Hezekiah Walker." },
      { tier: 2, label: "Direction", text: "Q1: a Donald Lawrence track that interpolates an MJ song from 'Invincible.' Q2: the title repeats four words right after 'Melodies from heaven.' Q3: an ensemble whose name pairs a sound word with a people. Q4 & Q5: both are well-known worship songs by Black gospel pastors — one about lifting hands early, the other about the greatness of God's name." },
      { tier: 3, label: "Bypass", text: "Q1: Healed, You Rock My World • Q2: Rain Down On Me • Q3: Sounds of Blackness • Q4: Praise Him in Advance — Marvin Sapp • Q5: Wonderful Is Your Name — Hezekiah Walker." },
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
      { tier: 1, label: "Nudge", text: "Moses' life starts as a baby and ends with him receiving the Law. Some events on the board belong to Abraham or to Babel." },
      { tier: 2, label: "Direction", text: "Begin with him hidden as an infant. End at Sinai. In between: a bush, plagues, and a sea." },
      { tier: 3, label: "Bypass", text: "Order: Basket, Burning Bush, Plagues, Red Sea, Ten Commandments." },
    ],
    timelineConfig: {
      intro: "Tap to ORDER Moses events. Tap ✕ to REMOVE imposters. Wrong moves = −30s.",
      finalCode: "12345",
      events: [
        { id: "basket", label: "Hidden in a basket", belongs: true, order: 1 },
        { id: "babel", label: "Tower of Babel", belongs: false },
        { id: "bush", label: "Burning Bush", belongs: true, order: 2 },
        { id: "abraham", label: "Abraham's covenant", belongs: false },
        { id: "plagues", label: "Ten Plagues", belongs: true, order: 3 },
        { id: "redsea", label: "Crossing the Red Sea", belongs: true, order: 4 },
        { id: "ten", label: "Ten Commandments", belongs: true, order: 5 },
      ],
    },
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
