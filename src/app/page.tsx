import { getGitHubProfile } from "./api/profile/route";
import HomeClient from "./HomeClient";
import axios from "axios";

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

interface GitHubFile {
  name: string;
  type: string;
  download_url: string;
}

interface PostFrontmatter {
  title?: string;
  date?: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  readingTime?: string;
}
async function getAllPosts(): Promise<PostMetadata[]> {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const yearsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/mdx/posts`;
    const { data: years } = await axios.get<GitHubFile[]>(yearsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const allPosts: PostMetadata[] = [];

    for (const year of years) {
      if (year.type !== "dir") continue;

      const monthsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/mdx/posts/${year.name}`;
      const { data: months } = await axios.get<GitHubFile[]>(monthsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      });

      for (const month of months) {
        if (month.type !== "dir") continue;

        const postsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/mdx/posts/${year.name}/${month.name}`;
        const { data: files } = await axios.get<GitHubFile[]>(postsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        });

        for (const file of files) {
          if (!file.name.endsWith(".mdx")) continue;

          try {
            const { data: content } = await axios.get<string>(
              file.download_url
            );
            const frontmatterRegex =
              /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
            const match = content.match(frontmatterRegex);

            if (!match) continue;

            const frontmatter = match[1];
            const markdownContent = match[2];

            const metadata: PostFrontmatter = {};
            frontmatter.split("\n").forEach((line: string) => {
              const [key, ...valueParts] = line.split(":");
              if (key && valueParts.length) {
                const value = valueParts
                  .join(":")
                  .trim()
                  .replace(/^["']|["']$/g, "");
                if (key === "tags") {
                  metadata.tags = value
                    .replace(/^\[|\]$/g, "")
                    .split(",")
                    .map((t: string) => t.trim().replace(/^["']|["']$/g, ""));
                } else {
                  (metadata as Record<string, string>)[key] = value;
                }
              }
            });

            const cleanContent = markdownContent
              .replace(/!\[.*?\]\(.*?\)/g, "")
              .replace(/#{1,6}\s/g, "")
              .replace(/\*\*(.*?)\*\*/g, "$1")
              .replace(/\*(.*?)\*/g, "$1")
              .replace(/`(.*?)`/g, "$1")
              .replace(/```[\s\S]*?```/g, "")
              .trim();

            const slug = file.name.replace(".mdx", "");

            allPosts.push({
              slug,
              title: metadata.title || "",
              date: metadata.date || "",
              category: metadata.category || "",
              tags: metadata.tags || [],
              thumbnail: metadata.thumbnail || "",
              excerpt: cleanContent.slice(0, 150) + "...",
              readingTime: metadata.readingTime || "",
            });
          } catch (error) {
            console.error(`파일 처리 실패: ${file.name}`, error);
          }
        }
      }
    }

    return allPosts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("포스트 목록 조회 실패:", error);
    return [];
  }
}

export default async function HomePage() {
  const posts = await getAllPosts();
  const profile = await getGitHubProfile();

  return <HomeClient posts={posts} profile={profile} />;
}
