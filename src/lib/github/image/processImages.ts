import { FileToCommit, processImage, replaceImageUrl } from "@/lib/github";

export const processImages = async (
  thumbnailFile: File | null,
  contentImages: Array<{ file: File; id: string }>,
  content: string,
  owner: string,
  repo: string
) => {
  const additionalFiles: FileToCommit[] = [];
  let thumbnailUrl = "";
  let processedContent = content;
  // 썸네일 처리
  if (thumbnailFile && thumbnailFile.size > 0) {
    const imageData = await processImage(thumbnailFile, owner, repo);
    thumbnailUrl = imageData.url;
    additionalFiles.push({
      path: imageData.filePath,
      content: imageData.content,
    });
  }

  // 본문 이미지 처리
  for (const { file, id } of contentImages) {
    const imageData = await processImage(file, owner, repo);

    additionalFiles.push({
      path: imageData.filePath,
      content: imageData.content,
    });
    processedContent = replaceImageUrl(processedContent, id, imageData.url);
  }
  return { additionalFiles, processedContent, thumbnailUrl };
};
