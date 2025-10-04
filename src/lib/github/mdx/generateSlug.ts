// lib/github/mdx/generateSlug.ts
export function generateSlug(title: string, timestamp: number): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-가-힣]/g, "")
    .slice(0, 50);

  return `${baseSlug}-${timestamp}`;
}
