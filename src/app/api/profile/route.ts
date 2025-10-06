// src/app/api/github/profile/route.ts
import axios from "axios";

interface GitHubProfile {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export async function getGitHubProfile(): Promise<GitHubProfile | null> {
  try {
    const owner = process.env.GITHUB_OWNER;
    const token = process.env.GITHUB_TOKEN;

    const response = await axios.get<GitHubProfile>(
      `https://api.github.com/users/${owner}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("GitHub 프로필 조회 실패:", error);
    return null;
  }
}
