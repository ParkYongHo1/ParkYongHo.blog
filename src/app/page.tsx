import Link from "next/link";
import axios from "axios";
import thumbnail from "@/asset/thumbnail.svg";
import Image from "next/image";
import calendar from "@/asset/calendar.svg";
import readingTimer from "@/asset/readingTime.svg";
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

async function getAllPosts(): Promise<PostMetadata[]> {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const yearsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/mdx/posts`;
    const { data: years } = await axios.get(yearsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const allPosts: PostMetadata[] = [];

    for (const year of years) {
      if (year.type !== "dir") continue;

      const monthsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/mdx/posts/${year.name}`;
      const { data: months } = await axios.get(monthsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      });

      for (const month of months) {
        if (month.type !== "dir") continue;

        const postsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/mdx/posts/${year.name}/${month.name}`;
        const { data: files } = await axios.get(postsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        });

        for (const file of files) {
          if (!file.name.endsWith(".mdx")) continue;

          try {
            const { data: content } = await axios.get(file.download_url);
            const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
            const match = content.match(frontmatterRegex);

            if (!match) continue;

            const frontmatter = match[1];
            const markdownContent = match[2];

            const metadata: any = {};
            frontmatter.split("\n").forEach((line: string) => {
              const [key, ...valueParts] = line.split(":");
              if (key && valueParts.length) {
                const value = valueParts
                  .join(":")
                  .trim()
                  .replace(/^["']|["']$/g, "");
                if (key === "tags") {
                  metadata[key] = value
                    .replace(/^\[|\]$/g, "")
                    .split(",")
                    .map((t: string) => t.trim().replace(/^["']|["']$/g, ""));
                } else {
                  metadata[key] = value;
                }
              }
            });

            // 이미지 마크다운 제거하고 excerpt 생성
            const cleanContent = markdownContent
              .replace(/!\[.*?\]\(.*?\)/g, "") // 이미지 마크다운 제거
              .replace(/#{1,6}\s/g, "") // 헤딩 마크다운 제거
              .replace(/\*\*(.*?)\*\*/g, "$1") // 볼드 마크다운 제거
              .replace(/\*(.*?)\*/g, "$1") // 이탤릭 마크다운 제거
              .replace(/`(.*?)`/g, "$1") // 인라인 코드 마크다운 제거
              .replace(/```[\s\S]*?```/g, "") // 코드 블록 제거
              .trim();

            const slug = file.name.replace(".mdx", "");

            allPosts.push({
              slug,
              title: metadata.title,
              date: metadata.date,
              category: metadata.category,
              tags: metadata.tags || [],
              thumbnail: metadata.thumbnail,
              excerpt: cleanContent.slice(0, 150) + "...",
              readingTime: metadata.readingTime,
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
export default async function PostsAllPage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen py-12">
      <div className="p-0">
        <div className="mb-12">
          <p className="text-gray-600">총 {posts.length}개의 포스트</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden max-w-sm mx-auto w-full"
            >
              <div className="relative w-full h-48 bg-gray-100">
                {post.thumbnail ? (
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Image
                    src={thumbnail}
                    alt="기본 썸네일"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-xs text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Image
                      src={calendar}
                      alt="날짜"
                      width={20}
                      height={20}
                      className="mr-1"
                    />
                    {post.date}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Image
                      src={readingTimer}
                      alt="읽는 시간"
                      width={20}
                      height={20}
                      className="mr-1"
                    />
                    <span>{post.readingTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
