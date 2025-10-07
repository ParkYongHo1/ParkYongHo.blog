import axios from "axios";
import { NextResponse } from "next/server";

interface GitHubProfile {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export async function GET() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const token = process.env.GITHUB_TOKEN;

    if (!owner) {
      return NextResponse.json(
        { error: "GITHUB_OWNER not configured" },
        { status: 500 }
      );
    }

    const response = await axios.get<GitHubProfile>(
      `https://api.github.com/users/${owner}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          Accept: "application/vnd.github+json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("GitHub 프로필 조회 실패:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub profile" },
      { status: 500 }
    );
  }
}
