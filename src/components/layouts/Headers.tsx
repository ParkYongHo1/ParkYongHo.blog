// src/components/Header.tsx
"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGitHubStore } from "@/store/githubStore";

export default function Header() {
  const { profile, loading, fetchGitHubData } = useGitHubStore();

  useEffect(() => {
    if (!profile) {
      fetchGitHubData();
    }
  }, [profile, fetchGitHubData]);

  if (loading) {
    return (
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-bold text-gray-900">
              {profile?.login || "ParkYongHo1"}.blog
            </h1>
          </Link>

          {profile?.avatarUrl && (
            <Image
              src={profile.avatarUrl}
              alt={profile.name || "Profile"}
              width={50}
              height={50}
              className="rounded-full"
              unoptimized
            />
          )}
        </div>
      </div>
    </header>
  );
}
