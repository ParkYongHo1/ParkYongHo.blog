// lib/github/metadata/updateCategoryMetadata.ts
import { AxiosInstance } from "axios";
import { PostMetadata } from "@/types/post";
import { fetchExistingMetadata } from "./fetchExistingMetadata";

export async function updateCategoryMetadata(
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
