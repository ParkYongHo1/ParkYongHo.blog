import { notFound } from "next/navigation";
import Image from "next/image";
import readingTimer from "@/asset/readingTime.svg";
import calendar from "@/asset/calendar.svg";
import axios from "axios";
import Giscus from "@/components/shared/Giscus";
import TableOfContents from "@/components/shared/TableOfContents";
import PostContent from "@/components/shared/PostContent";

interface PostData {
  title: string;
  date: string;
  category: string;
  tags: string[];
  thumbnail: string;
  readingTime: string;
  content: string;
}

interface GitHubFile {
  name: string;
  download_url: string;
}

interface PostMetadata {
  title?: string;
  date?: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  readingTime?: string;
}

async function getPostBySlug(slug: string): Promise<PostData | null> {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const decodedSlug = decodeURIComponent(slug);

    const postsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/mdx/posts`;

    const { data: files } = await axios.get<GitHubFile[]>(postsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const targetFile = files.find((file: GitHubFile) => {
      const fileName = file.name.replace(".mdx", "");
      return (
        fileName === decodedSlug ||
        fileName.includes(decodedSlug) ||
        decodeURIComponent(fileName) === decodedSlug
      );
    });

    if (!targetFile) return null;

    const { data: content } = await axios.get<string>(targetFile.download_url);
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) return null;

    const frontmatter = match[1];
    const markdownContent = match[2];

    const metadata: PostMetadata = {};
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

    return {
      title: metadata.title || "",
      date: metadata.date || "",
      category: metadata.category || "",
      tags: metadata.tags || [],
      thumbnail: metadata.thumbnail || "",
      readingTime: metadata.readingTime || "",
      content: markdownContent,
    };
  } catch (error) {
    console.error("포스트 조회 실패:", error);
    return null;
  }
}
function extractPostId(slug: string): string {
  // 마지막 하이픈(-) 뒤의 숫자를 ID로 추출
  const match = slug.match(/-(\d+)$/);
  return match ? match[1] : slug;
}
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }
  const postId = extractPostId(slug);
  return (
    <div className="min-h-screen">
      <div className="bg-white">
        <div className="max-w-4xl mx-auto my-4 sm:my-6 md:my-8 px-3 sm:px-4">
          <div className="flex justify-center mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm bg-purple-100 text-purple-700 px-2 sm:px-3 py-1 rounded-full">
              {post.category}
            </span>
          </div>
          <h1 className="flex justify-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 text-center px-2">
            {post.title}
          </h1>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center text-gray-500">
              <Image
                src={calendar}
                alt="날짜"
                width={16}
                height={16}
                className="mr-1 sm:w-5 sm:h-5"
              />
              {post.date}
            </div>
            <div className="flex items-center">
              <Image
                src={readingTimer}
                alt="읽는 시간"
                width={14}
                height={14}
                className="mr-1 sm:w-4 sm:h-4"
              />
              <span>{post.readingTime}</span>
            </div>
          </div>
          <div className="flex justify-center flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-2 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <PostContent
            content={post.content}
            title={post.title}
            thumbnail={post.thumbnail}
          />

          <div className="mt-8 sm:mt-12 md:mt-16 mb-6 sm:mb-8">
            <div className="border-t border-gray-200 pt-6 sm:pt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                댓글
              </h2>
              <div className="bg-white rounded-lg">
                <Giscus postId={postId} />
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden 2xl:block fixed right-8 top-32 w-64">
          <TableOfContents />
        </aside>
      </div>
    </div>
  );
}
