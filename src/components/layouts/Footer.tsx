"use client";

import Image from "next/image";
import Link from "next/link";
import github from "@/asset/github.svg";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white mt-15">
      <div className="w-[80%] mx-auto py-8">
        <div className="flex flex-col items-center space-y-4">
          <Link
            href="https://github.com/ParkYongHo1"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded hover:bg-gray-100 transition-colors"
          >
            <Image src={github} alt="GitHub" width={40} height={40} />
          </Link>
          <p className="text-sm text-gray-600">
            © 2025 ParkYongHo1. Built with Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
