// lib/github/mdx/createMDXContent.ts
export function createMDXContent(
  title: string,
  dateStr: string,
  category: string,
  tags: string[],
  thumbnailUrl: string,
  content: string,
  readingTimeText: string
): string {
  return `---
title: "${title}"
date: ${dateStr}
category: "${category || "Uncategorized"}"
tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]
thumbnail: "${thumbnailUrl}"
readingTime: "${readingTimeText}"
---

${content}
`;
}
