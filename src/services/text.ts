const STOPWORDS = new Set(
  "the a an and or but if then of to in on at for with by from as is are was were be been being this that these those it its into over under about after before not no can will would should could has have had do does did you your we our they their he she his her i me my more most very than also just".split(
    " ",
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

export function extractiveSummary(text: string, sentenceCount = 3): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [text.trim()];
  if (sentences.length <= sentenceCount) return sentences.join(" ");

  const freq = new Map<string, number>();
  for (const w of tokenize(text)) freq.set(w, (freq.get(w) ?? 0) + 1);

  const scored = sentences.map((s, index) => {
    const words = tokenize(s);
    const score = words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / (words.length || 1);
    return { s, index, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => a.index - b.index)
    .map((x) => x.s)
    .join(" ");
}

export interface TagSuggestion {
  matchedTags: string[];
  keywords: string[];
}

export function suggestTags(text: string, knownTags: string[], max = 5): TagSuggestion {
  const lower = text.toLowerCase();
  const matchedTags = knownTags
    .map((tag) => {
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(tag.toLowerCase())}($|[^\\p{L}\\p{N}])`, "gu");
      return { tag, count: (lower.match(pattern) ?? []).length };
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
    .map((x) => x.tag);

  const freq = new Map<string, number>();
  for (const w of tokenize(text)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .filter((w) => !matchedTags.some((t) => t.toLowerCase() === w))
    .slice(0, max);

  return { matchedTags, keywords };
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
