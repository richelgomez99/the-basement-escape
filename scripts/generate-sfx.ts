// Generates the 3 game SFX as MP3 files into src/assets/sfx/.
// Run once: bun scripts/generate-sfx.ts
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("ELEVENLABS_API_KEY not set");
  process.exit(1);
}

const OUT = join(process.cwd(), "src/assets/sfx");
mkdirSync(OUT, { recursive: true });

const sounds = [
  {
    file: "lock.mp3",
    duration: 1.5,
    prompt:
      "A heavy iron lock unlocking with a satisfying mechanical clunk and a brief warm shimmer of resonant metal — single hit, no music, dry, cinematic, short.",
  },
  {
    file: "error.mp3",
    duration: 0.8,
    prompt:
      "A short low dissonant buzz / negative feedback tone for a wrong answer in a puzzle game. Dry, not scary, single quick hit, no music.",
  },
  {
    file: "tick.mp3",
    duration: 1.0,
    prompt:
      "A single dry mechanical clock tick — wooden, small, like a grandfather-clock pendulum hit. One isolated tick, no reverb tail, no music.",
  },
];

for (const s of sounds) {
  console.log(`Generating ${s.file}…`);
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: s.prompt,
      duration_seconds: s.duration,
      prompt_influence: 0.5,
    }),
  });
  if (!res.ok) {
    console.error(`Failed for ${s.file}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT, s.file), buf);
  console.log(`  → wrote ${buf.length} bytes`);
}
console.log("Done.");
