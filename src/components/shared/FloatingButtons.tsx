"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import comment from "@/asset/comment.svg";

export default function FloatingButtons() {
  const [isShow, setIsShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScrollCheck = () => {
      setIsShow(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScrollCheck);
    handleScrollCheck();

    return () => window.removeEventListener("scroll", handleScrollCheck);
  }, []);

  if (!pathname.startsWith("/posts/")) return null;
  if (!isShow) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToComments = () => {
    const comments = document.querySelector(".giscus");
    comments?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed right-2 sm:right-4 bottom-12 flex flex-col gap-2 bg-white shadow-lg rounded-lg z-50 p-2">
      <button
        onClick={scrollToTop}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
        aria-label="맨 위로"
      >
        ↑
      </button>
      <button
        onClick={scrollToComments}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
        aria-label="댓글로"
      >
        <Image src={comment} alt="댓글" width={20} height={20} />
      </button>
    </div>
  );
}
