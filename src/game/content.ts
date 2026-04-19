// Single source of truth for puzzle content. Edit values via /admin or here.
// Artifacts concatenated in puzzle order form the final vault code.

export const GAME_DURATION_SECONDS = 60 * 60; // 60 minutes
export const RECALL_PENALTY_SECONDS = 120; // 2 minutes
export const TRAP_PENALTY_SECONDS = 30;

export const ADMIN_DEFAULT_PASSWORD = "glorious2025";

export type Hint = { tier: 1 | 2 | 3; label: string; text: string };

export type Puzzle = {
  id: number;
  title: string;
  flavor: string;
  scripture?: string;
  artifact: string; // single character
  answer: string; // canonical answer (case-insensitive compare)
  acceptable?: string[]; // optional alt answers
  hints: Hint[];
};

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
    flavor: "Five sacred symbols hide in the cathedral mural. Find them all.",
    scripture: "He who has eyes to see, let him see.",
    artifact: "A",
    answer: "light",
    hints: [
      { tier: 1, label: "Nudge", text: "Look near the windows, the altar, the floor — and shadows." },
      { tier: 2, label: "Direction", text: "Dove, fish, cross, lamb, bread. Five letters total." },
      { tier: 3, label: "Bypass", text: "The answer is: LIGHT" },
    ],
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
    flavor: "Cross the stones in order. A wrong step costs you 30 seconds. The path is hidden — find it.",
    scripture: "Strait is the gate, and narrow is the way. — Matthew 7:14",
    artifact: "V",
    answer: "narrow",
    hints: [
      { tier: 1, label: "Nudge", text: "The path is not straight — it weaves like a serpent." },
      { tier: 2, label: "Direction", text: "Row 1: left. Row 2: center. Row 3: right. Row 4: center. Then type the answer." },
      { tier: 3, label: "Bypass", text: "After crossing, the answer is: NARROW" },
    ],
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
    flavor: "A riddle of sacred numbers: (Days of the great flood) minus (the apostles times the prophet's days in the fish).",
    scripture: '"And rain was upon the earth forty days and forty nights." — Genesis 7:12',
    artifact: "T",
    answer: "4",
    hints: [
      { tier: 1, label: "Nudge", text: "Recall how long Noah's flood lasted." },
      { tier: 2, label: "Direction", text: "Twelve apostles × three days in the fish = thirty-six. Subtract from forty." },
      { tier: 3, label: "Bypass", text: "The answer is 4." },
    ],
  },
  {
    id: 7,
    title: "Broken Stained Glass",
    flavor: "Reassemble the shards. A word will appear.",
    artifact: "I",
    answer: "truth",
    hints: [
      { tier: 1, label: "Nudge", text: "Drag each piece to its matching slot." },
      { tier: 2, label: "Direction", text: "Five letters. 'I am the way, the ____, and the life.'" },
      { tier: 3, label: "Bypass", text: "The word is: TRUTH" },
    ],
  },
  {
    id: 8,
    title: "Voices in the Wilderness",
    flavor: "Four voices — four censored words. Their first letters spell the key.",
    artifact: "O",
    answer: "hope",
    hints: [
      { tier: 1, label: "Nudge", text: "Each clip has one word replaced with *BEEP*." },
      { tier: 2, label: "Direction", text: "Words: HEAR, OBEY, PRAY, ENDURE. Take the first letters." },
      { tier: 3, label: "Bypass", text: "The code is: HOPE" },
    ],
  },
  {
    id: 9,
    title: "The Timeline",
    flavor: "Order the life of Moses. Remove any event that doesn't belong. Wrong moves cost time.",
    artifact: "N",
    answer: "12345",
    hints: [
      { tier: 1, label: "Nudge", text: "Two events belong to Abraham or Babel — drop them. Each wrong move = 30s penalty." },
      { tier: 2, label: "Direction", text: "Basket → Burning Bush → Plagues → Red Sea → Ten Commandments." },
      { tier: 3, label: "Bypass", text: "Order: Basket, Burning Bush, Plagues, Red Sea, Ten Commandments." },
    ],
  },
];

const OVERRIDES_KEY = "be_content_overrides";

function readOverrides(): Partial<Record<number, Partial<Puzzle>>> {
  if (typeof window === "undefined") return {};
  try {
    const v = window.localStorage.getItem(OVERRIDES_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

export function getPuzzles(): Puzzle[] {
  const overrides = readOverrides();
  return DEFAULT_PUZZLES.map((p) => {
    const o = overrides[p.id];
    if (!o) return p;
    return { ...p, ...o, hints: o.hints ?? p.hints };
  });
}

export function getPuzzle(id: number): Puzzle | undefined {
  return getPuzzles().find((p) => p.id === id);
}

export function saveOverrides(overrides: Partial<Record<number, Partial<Puzzle>>>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event("be_content"));
}

export function getOverrides() {
  return readOverrides();
}

export function clearOverrides() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OVERRIDES_KEY);
  window.dispatchEvent(new Event("be_content"));
}

export function getVaultCode(): string {
  return getPuzzles()
    .map((p) => p.artifact)
    .join("");
}

// Backwards-compatible exports (computed from defaults; UI should prefer getPuzzles())
export const PUZZLES = DEFAULT_PUZZLES;
export const VAULT_CODE = DEFAULT_PUZZLES.map((p) => p.artifact).join("");
// = "EL4IG4TH5"

export const KEY_VERSE =
  '"And ye shall know the truth, and the truth shall make you free." — John 8:32';
