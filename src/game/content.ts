// Single source of truth for puzzle content. Edit values to customize.
// Artifacts concatenated in puzzle order form the final vault code.

export const GAME_DURATION_SECONDS = 60 * 60; // 60 minutes
export const RECALL_PENALTY_SECONDS = 120; // 2 minutes
export const TRAP_PENALTY_SECONDS = 30;

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

export const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: "Warm-up — Fill in the Blank",
    flavor: "A scroll lies open on the lectern. One word has faded.",
    scripture:
      'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have ______ life. — John 3:16',
    artifact: "E",
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
    artifact: "L",
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
    artifact: "4",
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
    flavor: "Cross the stones without falling. Each wrong step costs 30 seconds.",
    scripture: "The path of the just is as the shining light. — Proverbs 4:18",
    artifact: "I",
    answer: "i",
    hints: [
      { tier: 1, label: "Nudge", text: "The safe path traces a letter." },
      { tier: 2, label: "Direction", text: "Straight down the middle column." },
      { tier: 3, label: "Bypass", text: "The path forms the letter I." },
    ],
  },
  {
    id: 5,
    title: "Name That Tune",
    flavor: "A familiar hymn drifts through the crypt. Name it.",
    artifact: "G",
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
    flavor: "Solve the riddle: (Days of the flood) − (Apostles × Jonah's days in the fish)",
    scripture: "40 − (12 × 3) = ?",
    artifact: "4",
    answer: "4",
    hints: [
      { tier: 1, label: "Nudge", text: "Noah's flood lasted 40 days and 40 nights." },
      { tier: 2, label: "Direction", text: "12 apostles × 3 days = 36. Then 40 − 36." },
      { tier: 3, label: "Bypass", text: "The answer is 4." },
    ],
  },
  {
    id: 7,
    title: "Broken Stained Glass",
    flavor: "Reassemble the shards. A word will appear.",
    artifact: "T",
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
    flavor: "Three voices — three censored words. Their first letters spell the key.",
    artifact: "H",
    // The three censored words are: Hope, Obey, Pray → "HOP" → final letter for artifact: H (first)
    answer: "hop",
    hints: [
      { tier: 1, label: "Nudge", text: "Each clip has one word replaced with *BEEP*." },
      { tier: 2, label: "Direction", text: "Words: HOPE, OBEY, PRAY. Take the first letters." },
      { tier: 3, label: "Bypass", text: "The code is: HOP" },
    ],
  },
  {
    id: 9,
    title: "The Timeline",
    flavor: "Order the life of Moses. Remove any event that doesn't belong.",
    artifact: "5",
    // Order: Basket(1), Burning Bush(2), Plagues(3), Red Sea(4), Ten Commandments(5).
    // Decoys: Abraham's covenant, Tower of Babel.
    answer: "12345",
    hints: [
      { tier: 1, label: "Nudge", text: "Two events belong to Abraham/Babel — drop them." },
      { tier: 2, label: "Direction", text: "Basket → Burning Bush → Plagues → Red Sea → Ten Commandments." },
      { tier: 3, label: "Bypass", text: "Order: 1-2-3-4-5 (after removing decoys)." },
    ],
  },
];

export const VAULT_CODE = PUZZLES.map((p) => p.artifact).join("");
// = "EL4IG4TH5"

export const KEY_VERSE =
  '"And ye shall know the truth, and the truth shall make you free." — John 8:32';
