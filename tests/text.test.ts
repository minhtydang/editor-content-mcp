import { describe, expect, it } from "vitest";
import { extractiveSummary, suggestTags } from "../src/services/text.js";

const text =
  "Remote work changed collaboration. Teams use remote tools every day. Managers measure output differently now. Coffee is nice. Remote culture needs documentation and check-ins.";

describe("extractiveSummary", () => {
  it("returns the requested number of sentences in original order", () => {
    const s = extractiveSummary(text, 2);
    expect(s.split(/(?<=\.)\s/)).toHaveLength(2);
    expect(s.indexOf("Remote work")).toBeLessThan(s.indexOf("Remote culture") === -1 ? Infinity : s.indexOf("Remote culture") + 1);
  });
  it("returns short text unchanged", () => {
    expect(extractiveSummary("One sentence only.", 3)).toBe("One sentence only.");
  });
});

describe("suggestTags", () => {
  it("matches known tags on word boundaries and ranks by frequency", () => {
    const r = suggestTags("Remote work is great. remote work again. The api is fine.", ["remote work", "api", "ai"], 3);
    expect(r.matchedTags).toEqual(["remote work", "api"]);
  });
  it("does not match a tag inside another word", () => {
    const r = suggestTags("We maintain the rails of the train.", ["ai"], 3);
    expect(r.matchedTags).toEqual([]);
  });
  it("returns keywords that are not already matched tags", () => {
    const r = suggestTags("Pagination pagination pagination matters for api design design", ["api"], 3);
    expect(r.keywords[0]).toBe("pagination");
    expect(r.keywords).not.toContain("api");
  });
});
