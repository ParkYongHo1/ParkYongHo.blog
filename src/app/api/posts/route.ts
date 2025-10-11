import { NextRequest, NextResponse } from "next/server";
import readingTime from "reading-time";
import dayjs from "dayjs";
import { PostMetadata } from "@/types/post";
import {
  validateEnvironment,
  createGitHubClient,
  generateSlug,
  parseTags,
  createMDXContent,
  createPostWithMetadata,
  processImages,
  parseFormData,
  validateProductionEnvironment,
} from "@/lib/github";
import { handleApiError } from "@/lib/github/error/errorHandler";

export async function POST(request: NextRequest) {
  try {
    validateProductionEnvironment();

    const config = validateEnvironment();

    const formData = await parseFormData(request);

    const { additionalFiles, processedContent, thumbnailUrl } =
      await processImages(
        formData.thumbnailFile,
        formData.contentImages,
        formData.content,
        config.owner,
        config.repo
      );
    const now = dayjs();
    const timestamp = now.valueOf();
    const dateStr = now.format("YYYY-MM-DD HH:mm");
    const dateOnly = now.format("YYYY-MM-DD");

    const slug = generateSlug(formData.title, timestamp);
    const fileName = `${dateOnly}-${slug}.mdx`;
    const filePath = `mdx/posts/${fileName}`;

    const tags = parseTags(formData.tags);

    const stats = readingTime(formData.content);
    const minutes = Math.ceil(stats.minutes);
    const readingTimeText = `${minutes}분`;

    const mdxContent = createMDXContent(
      formData.title,
      dateStr,
      formData.category,
      tags,
      thumbnailUrl,
      formData.content,
      readingTimeText
    );

    const postMetadata: PostMetadata = {
      slug: `${dateOnly}-${slug}`,
      title: formData.title,
      date: dateStr,
      category: formData.category,
      tags,
      thumbnail: thumbnailUrl,
      excerpt: processedContent.slice(0, 150) + "...",
      readingTime: readingTimeText,
    };

    const githubApi = createGitHubClient(config.token);

    await createPostWithMetadata(
      githubApi,
      config.owner,
      config.repo,
      filePath,
      mdxContent,
      postMetadata,
      additionalFiles
    );

    return NextResponse.json({
      success: true,
      slug: `${dateOnly}-${slug}`,
      fileName,
      thumbnailUrl,
      contentImagesCount: formData.contentImages.length,
      readingTime: stats.text,
      branch: "main",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
