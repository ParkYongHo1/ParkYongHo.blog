"use client";

import { useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import summary from "@/asset/summary.svg";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";
import rehypeRaw from "rehype-raw";

interface PostContentProps {
  content: string;
}

interface AISummary {
  summary: string;
  keyPoints: string[];
  conclusion: string;
}

export default function PostContent({ content }: PostContentProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [isAISummary, setIsAISummary] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  //   const formatSummaryContent = (summaryData: AISummary): string => {
  //     return `## 📝 AI 요약

  // ${summaryData.summary}

  // ---

  // ## 💡 핵심 포인트

  // ${summaryData.keyPoints.map((point, index) => `${index + 1}. ${point}`).join("\n\n")}

  // ---

  // ## ✅ 결론

  // ${summaryData.conclusion}`;
  //   };

  // const generateAISummary = async () => {
  //   setIsGenerating(true);
  //   setIsTransitioning(true);

  //   try {
  //     const response = await fetch("/api/summarize", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ content }),
  //     });

  //     const data = await response.json();

  //     const summaryData: AISummary = {
  //       summary: data.summary || "",
  //       keyPoints: data.keyPoints || [],
  //       conclusion: data.conclusion || "",
  //     };

  //     setAiSummary(summaryData);
  //     const aiContentString = formatSummaryContent(summaryData);

  //     setIsGenerating(false);
  //     setIsAISummary(true);
  //     setDisplayedText(aiContentString);
  //   } catch (error) {
  //     console.error("요약 생성 실패:", error);
  //     alert("요약 중 오류가 발생했습니다.");
  //     setIsAISummary(false);
  //     setIsGenerating(false);
  //   } finally {
  //     setIsTransitioning(false);
  //   }
  // };

  // const switchToOriginal = () => {
  //   setIsAISummary(false);
  //   setDisplayedText("");
  // };

  // const toggleSummary = async () => {
  //   if (isTransitioning) return;

  //   if (!isAISummary && !aiSummary) {
  //     await generateAISummary();
  //   } else if (isAISummary && aiSummary) {
  //     switchToOriginal();
  //   } else if (!isAISummary && aiSummary) {
  //     setIsTransitioning(true);
  //     const aiContentString = formatSummaryContent(aiSummary);
  //     setIsAISummary(true);
  //     setDisplayedText(aiContentString);
  //     setIsTransitioning(false);
  //   }
  // };

  const markdownComponents = {
    h1: ({ ...props }: React.ComponentPropsWithoutRef<"h1">) => <h1 className="text-3xl font-bold mb-4 mt-6" {...props} />,
    h2: ({ ...props }: React.ComponentPropsWithoutRef<"h2">) => <h2 className="text-2xl font-bold mb-3 mt-5" {...props} />,
    h3: ({ ...props }: React.ComponentPropsWithoutRef<"h3">) => <h3 className="text-xl font-bold mb-2 mt-4" {...props} />,
    p: ({ ...props }: React.ComponentPropsWithoutRef<"p">) => <p className="mb-4 leading-7" {...props} />,
    ul: ({ ...props }: React.ComponentPropsWithoutRef<"ul">) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
    ol: ({ ...props }: React.ComponentPropsWithoutRef<"ol">) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
    li: ({ ...props }: React.ComponentPropsWithoutRef<"li">) => <li className="ml-4" {...props} />,
    blockquote: ({ ...props }: React.ComponentPropsWithoutRef<"blockquote">) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600" {...props} />,
    code: ({ inline, ...props }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) =>
      inline ? (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600" {...props} />
      ) : (
        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4" {...props} />
      ),
    pre: ({ ...props }: React.ComponentPropsWithoutRef<"pre">) => <pre className="my-4" {...props} />,
    a: ({ ...props }: React.ComponentPropsWithoutRef<"a">) => <a className="text-blue-600 hover:underline" {...props} />,
    strong: ({ ...props }: React.ComponentPropsWithoutRef<"strong">) => <strong className="font-bold" {...props} />,
    em: ({ ...props }: React.ComponentPropsWithoutRef<"em">) => <em className="italic" {...props} />,
    hr: ({ ...props }: React.ComponentPropsWithoutRef<"hr">) => <hr className="my-8 border-gray-300" {...props} />,
    img: ({ src, alt }: React.ComponentPropsWithoutRef<"img">) => {
      if (!src || typeof src !== "string") return null;

      // URL 유효성 검사
      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return url.startsWith("/");
        }
      };

      // 유효하지 않은 URL이면 일반 img 태그 사용
      if (!isValidUrl(src)) {
        return (
          <span className="flex justify-center my-4 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt || "이미지"} className="max-w-full h-auto rounded-lg" />
          </span>
        );
      }

      return (
        <span className="flex justify-center my-4 block">
          <span className="relative block w-full max-w-3xl mx-auto h-auto min-h-[300px]">
            <Image
              src={src}
              alt={alt || "이미지"}
              width={800}
              height={450}
              className="rounded-lg w-full h-auto"
              unoptimized={src.startsWith("http") && !src.includes(process.env.NEXT_PUBLIC_DOMAIN || "")}
            />
          </span>
        </span>
      );
    },
    table: ({ ...props }: React.ComponentPropsWithoutRef<"table">) => <table className="w-full border-collapse my-4" {...props} />,
    th: ({ ...props }: React.ComponentPropsWithoutRef<"th">) => <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-bold" {...props} />,
    td: ({ ...props }: React.ComponentPropsWithoutRef<"td">) => <td className="border border-gray-300 px-4 py-2" {...props} />,
  };

  return (
    <article className="prose prose-lg max-w-none bg-white my-4">
      <div className="min-h-[500px] py-4 prose prose-sm max-w-none border-t">
        {/* <div className="flex justify-end px-4 mb-4 not-prose">
          {!isAISummary ? (
            <button
              onClick={toggleSummary}
              disabled={isGenerating || isTransitioning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white cursor-pointer text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isGenerating && (
                <>
                  <Image src={summary} alt="요약" width={20} height={20} className="filter invert" />
                </>
              )}
              <span>AI 요약</span>
            </button>
          ) : (
            <button
              onClick={toggleSummary}
              disabled={isTransitioning}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <span>원본 글 보기</span>
            </button>
          )}
        </div> */}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">AI가 글을 요약하고 있습니다...</p>
          </div>
        )}

        {!isGenerating && (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeRaw]} components={markdownComponents}>
            {isAISummary ? displayedText : content}
          </ReactMarkdown>
        )}
      </div>
    </article>
  );
}
