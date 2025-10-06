"use client";
import Image from "next/image";
import axios from "axios";
import { usePostStore } from "@/store/postStore";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";

interface TempImage {
  file: File;
  objectUrl: string;
}

export default function WritePostPage() {
  const {
    imageFile,
    imagePreview,
    title,
    content,
    category,
    tags,
    postCreating,
    result,
    isPreviewMode,
    handlePreviewMode,
    setImageFile,
    setImagePreview,
    setTitle,
    setContent,
    setCategory,
    setTags,
    setPostCreating,
    setResult,
  } = usePostStore();

  const [isDragging, setIsDragging] = useState(false);
  const [tempImages, setTempImages] = useState<Map<string, TempImage>>(
    new Map()
  );

  // Object URL 정리
  useEffect(() => {
    return () => {
      tempImages.forEach(({ objectUrl }) => {
        URL.revokeObjectURL(objectUrl);
      });
    };
  }, [tempImages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 크기는 5MB를 초과할 수 없습니다.");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleThumbnailDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleThumbnailDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    try {
      const tempId = `temp-${Date.now()}-${crypto.randomUUID()}`;
      const objectUrl = URL.createObjectURL(file);
      const markdownImage = `![${file.name}](${tempId})`;

      const textarea = e.target as HTMLTextAreaElement;
      const cursorPosition = textarea.selectionStart;
      const textBefore = content.substring(0, cursorPosition);
      const textAfter = content.substring(cursorPosition);

      setContent(textBefore + markdownImage + textAfter);

      setTempImages((prev) => new Map(prev).set(tempId, { file, objectUrl }));
    } catch (error) {
      console.error(error);
      alert("이미지 처리 실패");
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();

        const file = items[i].getAsFile();
        if (!file) continue;

        if (file.size > 5 * 1024 * 1024) {
          alert("이미지 크기는 5MB를 초과할 수 없습니다.");
          return;
        }

        try {
          const tempId = `temp-${Date.now()}-${crypto.randomUUID()}`;
          const objectUrl = URL.createObjectURL(file);
          const markdownImage = `![붙여넣은 이미지](${tempId})`;

          const textarea = e.target as HTMLTextAreaElement;
          const cursorPosition = textarea.selectionStart;
          const textBefore = content.substring(0, cursorPosition);
          const textAfter = content.substring(cursorPosition);

          setContent(textBefore + markdownImage + textAfter);

          setTempImages((prev) =>
            new Map(prev).set(tempId, { file, objectUrl })
          );
        } catch (error) {
          console.error(error);
          alert("이미지 처리 실패");
        }

        break;
      }
    }
  };

  const testCreatePost = async () => {
    if (!title || !content) {
      alert("제목과 내용을 입력하세요");
      return;
    }

    setPostCreating(true);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("content", content);
      formData.append("category", category || "Uncategorized");
      formData.append("tags", tags);

      if (imageFile) {
        formData.append("thumbnail", imageFile);
      }

      // 본문 이미지들 추가 (tempImages)
      tempImages.forEach((imageData, tempId) => {
        formData.append("contentImages", imageData.file);
        formData.append("contentImageIds", tempId);
      });

      // 서버 요청
      const response = await axios.post("/api/posts", formData);

      setResult(response.data);
      alert("글 작성 성공!");
    } catch (error: unknown) {
      console.error("글 작성 실패:", error);

      // Axios 에러 안전 처리
      if (axios.isAxiosError(error)) {
        alert(`글 작성 실패: ${error.response?.data?.error || error.message}`);
      } else if (error instanceof Error) {
        alert(`글 작성 실패: ${error.message}`);
      } else {
        alert("글 작성 실패: 알 수 없는 오류");
      }
    } finally {
      setPostCreating(false);
    }
  };

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">접근 불가</h1>
          <p className="text-gray-600">
            글 작성 기능은 개발 환경에서만 사용할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">새 글 작성</h1>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="카테고리 (예: 개발, 일상)"
              className="px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="태그 (쉼표로 구분, 예: React, Next.js)"
            />
          </div>

          <div className="border border-gray-300 rounded-md p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                썸네일 이미지
              </label>
              <label
                htmlFor="thumbnail-upload"
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-700"
              >
                이미지 선택
              </label>
              <input
                id="thumbnail-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            {imagePreview && imagePreview !== "" ? (
              <div
                className="relative w-full h-80 rounded border border-gray-200 overflow-hidden bg-gray-100"
                onDragOver={handleThumbnailDragOver}
                onDrop={handleThumbnailDrop}
              >
                <Image
                  src={imagePreview}
                  alt="썸네일 미리보기"
                  fill
                  className="object-contain"
                  unoptimized
                />
                <button
                  onClick={() => {
                    setImagePreview("");
                    setImageFile(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 z-10"
                >
                  제거
                </button>
              </div>
            ) : (
              <div
                className="w-full h-80 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 transition-colors"
                onDragOver={handleThumbnailDragOver}
                onDrop={handleThumbnailDrop}
                onClick={() =>
                  document.getElementById("thumbnail-upload")?.click()
                }
              >
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-1 text-sm">
                    썸네일을 드래그하거나 클릭하여 선택
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    (미선택 시 기본 이미지 사용)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border border-gray-300 rounded-md bg-white">
            <div className="border-b border-gray-300 flex items-center px-3 py-2 bg-gray-50">
              <button
                onClick={handlePreviewMode}
                className={`px-4 py-1.5 text-sm font-medium rounded ${
                  !isPreviewMode
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Write
              </button>
              <button
                onClick={handlePreviewMode}
                className={`px-4 py-1.5 text-sm font-medium rounded ${
                  isPreviewMode
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Preview
              </button>
              {tempImages.size > 0 && (
                <span className="ml-auto text-sm text-gray-600">
                  임시 이미지: {tempImages.size}개
                </span>
              )}
            </div>

            <div className="p-0">
              {!isPreviewMode ? (
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    className={`w-full min-h-[500px] p-4 border-0 focus:ring-0 outline-none resize-none font-mono text-sm ${
                      isDragging ? "bg-blue-50 border-2 border-blue-400" : ""
                    }`}
                    placeholder="마크다운으로 글을 작성하세요...

이미지를 드래그하거나 붙여넣기(Ctrl+V)로 추가할 수 있습니다.

# 제목
## 소제목

**굵게**, *기울임*, \`코드\`

- 리스트
- 항목

\`\`\`javascript
'코드 블록'
\`\`\`"
                  />
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 pointer-events-none">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-16 w-16 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mt-2 text-lg font-medium text-blue-600">
                          이미지를 여기에 드롭하세요
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[500px] p-4 prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ ...props }) => (
                        <h1
                          className="text-3xl font-bold mb-4 mt-6"
                          {...props}
                        />
                      ),
                      h2: ({ ...props }) => (
                        <h2
                          className="text-2xl font-bold mb-3 mt-5"
                          {...props}
                        />
                      ),
                      h3: ({ ...props }) => (
                        <h3
                          className="text-xl font-bold mb-2 mt-4"
                          {...props}
                        />
                      ),
                      p: ({ ...props }) => (
                        <p className="mb-4 leading-7" {...props} />
                      ),
                      ul: ({ ...props }) => (
                        <ul
                          className="list-disc list-inside mb-4 space-y-2"
                          {...props}
                        />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          className="list-decimal list-inside mb-4 space-y-2"
                          {...props}
                        />
                      ),
                      li: ({ ...props }) => <li className="ml-4" {...props} />,
                      blockquote: ({ ...props }) => (
                        <blockquote
                          className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600"
                          {...props}
                        />
                      ),
                      code: ({
                        inline,
                        children,
                        ...props
                      }: React.DetailedHTMLProps<
                        React.HTMLAttributes<HTMLElement>,
                        HTMLElement
                      > & { inline?: boolean }) =>
                        inline ? (
                          <code
                            className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4"
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                      pre: ({ ...props }) => (
                        <pre className="my-4" {...props} />
                      ),
                      a: ({ ...props }) => (
                        <a
                          className="text-blue-600 hover:underline"
                          {...props}
                        />
                      ),
                      strong: ({ ...props }) => (
                        <strong className="font-bold" {...props} />
                      ),
                      em: ({ ...props }) => (
                        <em className="italic" {...props} />
                      ),
                      hr: ({ ...props }) => (
                        <hr className="my-8 border-gray-300" {...props} />
                      ),
                      img: ({
                        src,
                        alt,
                        ...props
                      }: React.DetailedHTMLProps<
                        React.ImgHTMLAttributes<HTMLImageElement>,
                        HTMLImageElement
                      >) => {
                        if (
                          !src ||
                          typeof src !== "string" ||
                          src.trim() === ""
                        )
                          return null;
                        if (src.startsWith("temp-")) {
                          const imageData = tempImages.get(src);
                          if (imageData) {
                            return (
                              <span className="flex justify-center my-4 block">
                                <Image
                                  src={imageData.objectUrl}
                                  alt={alt || "이미지"}
                                  width={800 as number}
                                  height={600 as number}
                                  className="max-w-full h-auto rounded-lg"
                                  unoptimized
                                  {...(props as Omit<
                                    React.DetailedHTMLProps<
                                      React.ImgHTMLAttributes<HTMLImageElement>,
                                      HTMLImageElement
                                    >,
                                    "width" | "height" | "src" | "alt"
                                  >)}
                                />
                              </span>
                            );
                          }
                          return null;
                        }
                        return (
                          <span className="flex justify-center my-4 block">
                            <Image
                              src={src}
                              alt={alt || "이미지"}
                              width={800 as number}
                              height={600 as number}
                              className="max-w-full h-auto rounded-lg"
                              unoptimized
                              {...(props as Omit<
                                React.DetailedHTMLProps<
                                  React.ImgHTMLAttributes<HTMLImageElement>,
                                  HTMLImageElement
                                >,
                                "width" | "height" | "src" | "alt"
                              >)}
                            />
                          </span>
                        );
                      },
                      table: ({ ...props }) => (
                        <table
                          className="w-full border-collapse my-4"
                          {...props}
                        />
                      ),
                      th: ({ ...props }) => (
                        <th
                          className="border border-gray-300 px-4 py-2 bg-gray-100 font-bold"
                          {...props}
                        />
                      ),
                      td: ({ ...props }) => (
                        <td
                          className="border border-gray-300 px-4 py-2"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {content || "*미리보기할 내용이 없습니다*"}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="border-t border-gray-300 px-4 py-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <div>
                {!isPreviewMode && (
                  <span>이미지를 드래그하거나 클립보드에서 붙여넣으세요</span>
                )}
              </div>
              <div className="flex gap-4">
                <span>
                  글자 수: {content.replace(/!\[.*?\]\(.*?\)/g, "").length}
                </span>
                <span>
                  예상 읽기:{" "}
                  {Math.ceil(
                    content.replace(/!\[.*?\]\(.*?\)/g, "").length / 400
                  )}
                  분
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (
                  confirm("작성중인 내용이 모두 사라집니다. 계속하시겠습니까?")
                ) {
                  setTitle("");
                  setContent("");
                  setCategory("");
                  setTags("");
                  setImagePreview("");
                  setImageFile(null);

                  // 임시 이미지 정리
                  tempImages.forEach(({ objectUrl }) => {
                    URL.revokeObjectURL(objectUrl);
                  });
                  setTempImages(new Map());
                }
              }}
            >
              취소
            </Button>
            <Button
              onClick={testCreatePost}
              disabled={postCreating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {postCreating ? "저장 중..." : "글 발행하기"}
            </Button>
          </div>

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium text-green-800">
                글이 성공적으로 발행되었습니다!
              </p>
              <details className="mt-2">
                <summary className="text-sm text-green-700 cursor-pointer">
                  상세 정보 보기
                </summary>
                <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto border border-green-200">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
