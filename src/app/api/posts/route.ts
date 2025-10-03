// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosInstance } from "axios";
import readingTime from "reading-time";
import dayjs from "dayjs";
import {
  createGitHubClient,
  GitHubConfig,
  validateEnvironment,
} from "@/lib/github";
// ============================================
// 타입 정의
// ============================================

interface PostMetadata {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  thumbnail: string;
  excerpt: string;
  readingTime: string;
}

interface FileToCommit {
  path: string;
  content: string;
}

// ============================================
// 유틸리티 함수
// ============================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-가-힣]/g, "");
}

function parseTags(tagsString: string): string[] {
  return tagsString
    ? tagsString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
}

async function processImage(
  file: File,
  owner: string,
  repo: string
): Promise<{ filePath: string; content: string; url: string }> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const imageName = `${timestamp}-${sanitizedName}`;
  const filePath = `mdx/images/${imageName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const content = buffer.toString("base64");

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/dev/${filePath}`;

  return { filePath, content, url };
}

function createMDXContent(
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

// ============================================
// 메타데이터 처리
// ============================================

async function fetchExistingMetadata(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  path: string
): Promise<PostMetadata[]> {
  try {
    const { data: file } = await githubApi.get(
      `/repos/${owner}/${repo}/contents/${path}?ref=dev`
    );
    const content = Buffer.from(file.content, "base64").toString("utf-8");
    return JSON.parse(content);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

async function updateCategoryMetadata(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  post: PostMetadata
): Promise<string> {
  const path = `mdx/metadata/categories/${post.category}.json`;
  const posts = await fetchExistingMetadata(githubApi, owner, repo, path);
  posts.unshift(post);
  return JSON.stringify(posts, null, 2);
}

async function updateTagMetadata(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  post: PostMetadata,
  tag: string
): Promise<string> {
  const path = `mdx/metadata/tags/${tag}.json`;
  const posts = await fetchExistingMetadata(githubApi, owner, repo, path);
  posts.unshift(post);
  return JSON.stringify(posts, null, 2);
}

async function updateYearlyMetadata(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  post: PostMetadata,
  year: number
): Promise<string> {
  const path = `mdx/metadata/yearly/${year}.json`;
  const posts = await fetchExistingMetadata(githubApi, owner, repo, path);
  posts.unshift(post);
  return JSON.stringify(posts, null, 2);
}

// ============================================
// GitHub 커밋
// ============================================

async function commitFilesToGitHub(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  files: FileToCommit[],
  commitMessage: string
): Promise<void> {
  const { data: refData } = await githubApi.get(
    `/repos/${owner}/${repo}/git/ref/heads/dev`
  );
  const latestCommitSha = refData.object.sha;

  const { data: commitData } = await githubApi.get(
    `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
  );
  const baseTreeSha = commitData.tree.sha;

  const tree = files.map((file) => ({
    path: file.path,
    mode: "100644" as const,
    type: "blob" as const,
    content: file.content,
  }));

  const { data: newTree } = await githubApi.post(
    `/repos/${owner}/${repo}/git/trees`,
    { base_tree: baseTreeSha, tree }
  );

  const { data: newCommit } = await githubApi.post(
    `/repos/${owner}/${repo}/git/commits`,
    {
      message: commitMessage,
      tree: newTree.sha,
      parents: [latestCommitSha],
    }
  );

  await githubApi.patch(`/repos/${owner}/${repo}/git/refs/heads/dev`, {
    sha: newCommit.sha,
  });
}

async function createPostWithMetadata(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  mdxFilePath: string,
  mdxContent: string,
  post: PostMetadata,
  year: number,
  imageFilePath?: string,
  imageContent?: string
): Promise<void> {
  const files: FileToCommit[] = [];

  if (imageFilePath && imageContent) {
    files.push({ path: imageFilePath, content: imageContent });
  }

  files.push({ path: mdxFilePath, content: mdxContent });

  const categoryPath = `mdx/metadata/categories/${post.category}.json`;
  const categoryContent = await updateCategoryMetadata(
    githubApi,
    owner,
    repo,
    post
  );
  files.push({ path: categoryPath, content: categoryContent });

  for (const tag of post.tags) {
    const tagPath = `mdx/metadata/tags/${tag}.json`;
    const tagContent = await updateTagMetadata(
      githubApi,
      owner,
      repo,
      post,
      tag
    );
    files.push({ path: tagPath, content: tagContent });
  }

  const yearlyPath = `mdx/metadata/yearly/${year}.json`;
  const yearlyContent = await updateYearlyMetadata(
    githubApi,
    owner,
    repo,
    post,
    year
  );
  files.push({ path: yearlyPath, content: yearlyContent });

  await commitFilesToGitHub(
    githubApi,
    owner,
    repo,
    files,
    `Add post: ${post.title}`
  );
}

// ============================================
// 메인 핸들러
// ============================================

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
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const tagsString = formData.get("tags") as string;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    const stats = readingTime(content);

    const slug = generateSlug(title);
    const now = dayjs();
    const timestamp = now.valueOf();
    const dateStr = now.format("YYYY-MM-DD HH:mm");
    const dateOnly = now.format("YYYY-MM-DD");
    const year = now.year();
    const month = now.format("MM");

    const fileName = `${dateOnly}-${slug}-${timestamp}.mdx`;
    const filePath = `mdx/posts/${year}/${month}/${fileName}`;

    const tags = parseTags(tagsString);

    let thumbnailUrl = "";
    let imageFilePath = "";
    let imageContent = "";

    if (thumbnailFile && thumbnailFile.size > 0) {
      const imageData = await processImage(
        thumbnailFile,
        config.owner,
        config.repo
      );
      thumbnailUrl = imageData.url;
      imageFilePath = imageData.filePath;
      imageContent = imageData.content;
    }

    const mdxContent = createMDXContent(
      title,
      dateStr,
      category,
      tags,
      thumbnailUrl,
      content,
      stats.text
    );

    const postMetadata: PostMetadata = {
      slug: `${dateStr}-${slug}`,
      title,
      date: dateStr,
      category: category,
      tags,
      thumbnail: thumbnailUrl,
      excerpt: content.slice(0, 150) + "...",
      readingTime: stats.text,
    };

    const githubApi = createGitHubClient(config.token);

    await createPostWithMetadata(
      githubApi,
      config.owner,
      config.repo,
      filePath,
      mdxContent,
      postMetadata,
      year,
      imageFilePath,
      imageContent
    );

    return NextResponse.json({
      success: true,
      slug: `${dateStr}-${slug}`,
      fileName,
      thumbnailUrl,
      readingTime: stats.text,
      branch: "dev",
    });
  } catch (error) {
    console.error("API 라우트 오류:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

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
