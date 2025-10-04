// lib/github/image/processImage.ts
export async function processImage(
  file: File,
  owner: string,
  repo: string
): Promise<{ filePath: string; content: string; url: string }> {
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("파일 크기는 5MB를 초과할 수 없습니다.");
  }

  const uuid = crypto.randomUUID();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const imageName = `${Date.now()}-${uuid}.${ext}`;
  const filePath = `mdx/images/${imageName}`;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const content = Buffer.from(uint8Array).toString("base64");

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;

  return { filePath, content, url };
}
