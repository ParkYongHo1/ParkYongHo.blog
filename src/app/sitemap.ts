import { MetadataRoute } from "next";
import axios from "axios";

interface GitHubFile {
  name: string;
  download_url: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  const postsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/mdx/posts`;

  try {
    const { data: files } = await axios.get<GitHubFile[]>(postsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const posts = files.map((file) => {
      const slug = file.name.replace(".mdx", "");
      return {
        url: `https://park-yong-ho-blog.vercel.app/posts/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

    return [
      {
        url: "https://park-yong-ho-blog.vercel.app",
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      ...posts,
    ];
  } catch (error) {
    console.error("Sitemap 생성 실패:", error);
    return [
      {
        url: "https://park-yong-ho-blog.vercel.app",
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }
}
