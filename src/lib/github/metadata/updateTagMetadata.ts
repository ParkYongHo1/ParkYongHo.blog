// lib/github/metadata/updateTagMetadata.ts
import { AxiosInstance } from "axios";
import { fetchExistingMetadata } from "./fetchExistingMetadata";
import { PostMetadata } from "@/types/post";

export async function updateTagMetadata(
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
