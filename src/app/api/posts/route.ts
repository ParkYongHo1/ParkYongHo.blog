// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosInstance } from "axios";
import readingTime from "reading-time";
import dayjs from "dayjs";

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

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

interface FileToCommit {
  path: string;
  content: string;
}

function validateEnvironment(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return null;
  }

  return { token, owner, repo };
}

function createGitHubClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
}

function generateSlug(title: string, timestamp: number): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-가-힣]/g, "")
    .slice(0, 50);

  return `${baseSlug}-${timestamp}`;
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

async function fetchExistingMetadata(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  path: string
): Promise<PostMetadata[]> {
  try {
    const { data: file } = await githubApi.get(
      `/repos/${owner}/${repo}/contents/${path}?ref=main`
    );
    const content = Buffer.from(file.content, "base64").toString("utf-8");

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.warn(
        `깨진 메타데이터 파일 발견: ${path}. 빈 배열로 초기화합니다.`
      );
      return [];
    }
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

async function commitFilesToGitHub(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  files: FileToCommit[],
  commitMessage: string
): Promise<void> {
  const { data: refData } = await githubApi.get(
    `/repos/${owner}/${repo}/git/ref/heads/main`
  );
  const latestCommitSha = refData.object.sha;

  const { data: commitData } = await githubApi.get(
    `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
  );
  const baseTreeSha = commitData.tree.sha;

  const tree = await Promise.all(
    files.map(async (file) => {
      let blobContent;
      let encoding: "utf-8" | "base64";

      const isTextFile =
        file.path.endsWith(".mdx") ||
        file.path.endsWith(".json") ||
        file.path.endsWith(".md") ||
        file.path.endsWith(".txt");

      if (isTextFile) {
        blobContent = file.content;
        encoding = "utf-8";
      } else {
        blobContent = file.content;
        encoding = "base64";
      }

      const { data: blob } = await githubApi.post(
        `/repos/${owner}/${repo}/git/blobs`,
        {
          content: blobContent,
          encoding: encoding,
        }
      );

      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

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

  await githubApi.patch(`/repos/${owner}/${repo}/git/refs/heads/main`, {
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
  additionalFiles: FileToCommit[]
): Promise<void> {
  const files: FileToCommit[] = [...additionalFiles];

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
    const month = now.format("MM");

    const slug = generateSlug(title, timestamp);
    const fileName = `${dateOnly}-${slug}.mdx`;
    const filePath = `mdx/posts/${year}/${month}/${fileName}`;

    const tags = parseTags(tagsString);
    const additionalFiles: FileToCommit[] = [];

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
      slug: `${dateOnly}-${slug}`,
      title,
      date: dateStr,
      category: category || "Uncategorized",
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
