// lib/github/metadata/fetchExistingMetadata.ts
import { AxiosInstance } from "axios";
import { PostMetadata } from "@/types/post";

export async function fetchExistingMetadata(
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
