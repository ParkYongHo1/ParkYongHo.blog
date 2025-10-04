// lib/github/commit/createPostWithMetadata.ts
import { AxiosInstance } from "axios";
import { PostMetadata } from "@/types/post";
import {
  updateCategoryMetadata,
  updateTagMetadata,
  updateYearlyMetadata,
} from "../metadata";
import { commitFilesToGitHub, FileToCommit } from "./commitFilesToGitHub";

export async function createPostWithMetadata(
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
