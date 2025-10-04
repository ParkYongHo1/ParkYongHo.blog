// lib/github/mdx/parseTags.ts
export function parseTags(tagsString: string): string[] {
  return tagsString
    ? tagsString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
}
