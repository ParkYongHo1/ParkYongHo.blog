// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import readingTime from "reading-time";
import dayjs from "dayjs";
import { PostMetadata } from "@/types/post";
import {
  validateEnvironment,
  createGitHubClient,
  processImage,
  generateSlug,
  parseTags,
  createMDXContent,
  createPostWithMetadata,
  FileToCommit,
} from "@/lib/github";

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "글 작성은 개발 환경에서만 가능합니다." },
        { status: 403 }
      );
    }

    const config = validateEnvironment();
    if (!config) {
      return NextResponse.json(
        { error: "GitHub 설정이 올바르지 않습니다." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    let content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const tagsString = formData.get("tags") as string;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    const contentImageCount = parseInt(
      (formData.get("contentImageCount") as string) || "0"
    );
    const contentImages: File[] = [];
    const contentImageIds: string[] = [];

    for (let i = 0; i < contentImageCount; i++) {
      const file = formData.get(`contentImage_${i}`) as File;
      const id = formData.get(`contentImageId_${i}`) as string;
      if (file && id) {
        contentImages.push(file);
        contentImageIds.push(id);
      }
    }

    const now = dayjs();
    const timestamp = now.valueOf();
    const dateStr = now.format("YYYY-MM-DD HH:mm");
    const dateOnly = now.format("YYYY-MM-DD");
    const year = now.year();

    const slug = generateSlug(title, timestamp);
    const fileName = `${dateOnly}-${slug}.mdx`;
    const filePath = `mdx/posts/${fileName}`;

    const tags = parseTags(tagsString);
    const additionalFiles: FileToCommit[] = [];

    // 썸네일 처리
    let thumbnailUrl = "";
    if (thumbnailFile && thumbnailFile.size > 0) {
      const imageData = await processImage(
        thumbnailFile,
        config.owner,
        config.repo
      );
      thumbnailUrl = imageData.url;
      additionalFiles.push({
        path: imageData.filePath,
        content: imageData.content,
      });
    }

    // 본문 이미지 처리
    for (let i = 0; i < contentImages.length; i++) {
      const file = contentImages[i];
      const tempId = contentImageIds[i];

      const imageData = await processImage(file, config.owner, config.repo);
      additionalFiles.push({
        path: imageData.filePath,
        content: imageData.content,
      });

      const escapedTempId = tempId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\(${escapedTempId}\\)`, "g");
      content = content.replace(regex, `(${imageData.url})`);
    }

    const stats = readingTime(content);
    const minutes = Math.ceil(stats.minutes);
    const readingTimeText = `${minutes}분`;

    const mdxContent = createMDXContent(
      title,
      dateStr,
      category,
      tags,
      thumbnailUrl,
      content,
      readingTimeText
    );

    const postMetadata: PostMetadata = {
      slug: `${dateOnly}-${slug}`,
      title,
      date: dateStr,
      category: category || "Uncategorized",
      tags,
      thumbnail: thumbnailUrl,
      excerpt: content.slice(0, 150) + "...",
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
      contentImagesCount: contentImages.length,
      readingTime: stats.text,
      branch: "main",
    });
  } catch (error) {
    console.error("API 라우트 오류:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 429) {
        return NextResponse.json(
          { error: "GitHub API 요청 한도 초과. 잠시 후 다시 시도해주세요." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `GitHub API 오류: ${message}` },
        { status: status || 500 }
      );
    }

    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
