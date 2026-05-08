// Shared lenient answer matching used by single-answer puzzles
// (AnswerForm / PuzzleShell.checkAnswer) and the multi-question runner.
//
// Goals:
//  - Ignore capitalization, accents, punctuation, hyphens, commas, slashes.
//  - Collapse all whitespace.
//  - Treat optional leading articles ("a", "an", "the") as optional.
//  - Accept multi-part answers in any order ("matthew, mark" == "mark and matthew").

export function normalizeAnswer(s: string): string {
  if (!s) return "";
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035`']/g, "") // smart + straight apostrophes
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"]/g, "") // smart + straight quotes
    .replace(/[-\u2010-\u2015_/&,;:.!?(){}\[\]]/g, " ") // common punctuation -> space
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingArticle(s: string): string {
  return s.replace(/^(?:the|a|an)\s+/, "");
}

function splitParts(s: string): string[] {
  // After normalize, splitters become spaces. Re-split on common joiners
  // BEFORE normalization so we keep multi-part comparison working.
  return s
    .split(/\s*(?:-|\u2010|\u2011|\u2012|\u2013|\u2014|\u2015|,|\/|&|\band\b|\bby\b)\s*/gi)
    .map((p) => normalizeAnswer(p))
    .filter(Boolean);
}

export function answersMatch(input: string, candidate: string): boolean {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(candidate);
  if (!a || !b) return false;
  if (a === b) return true;
  if (stripLeadingArticle(a) === stripLeadingArticle(b)) return true;

  // Multi-part (any order) — only when candidate clearly has multiple parts.
  const aParts = splitParts(input).map(stripLeadingArticle).sort();
  const bParts = splitParts(candidate).map(stripLeadingArticle).sort();
  if (bParts.length >= 2 && aParts.length === bParts.length) {
    if (aParts.every((p, i) => p === bParts[i])) return true;
  }
  return false;
}

export function isAnswerCorrect(
  input: string,
  answer: string,
  acceptable?: string[],
): boolean {
  if (answersMatch(input, answer)) return true;
  if (acceptable?.some((a) => answersMatch(input, a))) return true;
  return false;
}

export const ANSWER_FORMAT_HINT =
  "Capitalization, punctuation, and accents are ignored.";
