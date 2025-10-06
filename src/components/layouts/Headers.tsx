"use client";

import Image from "next/image";
import Link from "next/link";
import github from "@/asset/github.svg";
export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="w-[80%] mx-auto">
        <div className="flex items-center justify-between h-18">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-bold text-gray-900">
              ParkYongHo1.blog
            </h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href={`https://github.com/ParkYongHo1`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Image src={github} alt="GitHub" width={28} height={28} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
