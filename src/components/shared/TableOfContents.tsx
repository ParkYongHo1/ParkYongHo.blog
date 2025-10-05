"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const updateToc = () => {
      const headings = document.querySelectorAll("article h2, article h3");
      const items: TocItem[] = [];

      headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        items.push({
          id,
          text: heading.textContent || "",
          level: parseInt(heading.tagName[1]),
        });
      });

      setToc(items);
    };

    updateToc();

    const observer = new MutationObserver(() => {
      updateToc();
    });

    const articleElement = document.querySelector("article");
    if (articleElement) {
      observer.observe(articleElement, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (toc.length === 0) return;

    const headings = document.querySelectorAll("article h2, article h3");

    // 스크롤 감지
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (toc.length === 0) return null;

  return (
    <nav className="hidden xl:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="text-sm">
        <h3 className="font-bold text-gray-900 mb-4">목차</h3>
        <ul className="space-y-2">
          {toc.map((item) => (
            <li key={item.id} className={`${item.level === 3 ? "ml-4" : ""}`}>
              <button
                onClick={() => scrollToHeading(item.id)}
                className={`text-left w-full hover:text-purple-600 transition-colors ${
                  activeId === item.id
                    ? "text-purple-600 font-semibold"
                    : "text-gray-600"
                }`}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
