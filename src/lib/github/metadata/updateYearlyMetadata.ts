// lib/github/metadata/updateYearlyMetadata.ts
import { AxiosInstance } from "axios";
import { PostMetadata } from "@/types/post";
import { fetchExistingMetadata } from "./fetchExistingMetadata";

export async function updateYearlyMetadata(
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
