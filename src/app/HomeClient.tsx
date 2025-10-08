"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import thumbnail from "../asset/thumbnail.svg";
import calendar from "../asset/calendar.svg";
import readingTimer from "../asset/readingTime.svg";

interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  thumbnail: string;
  excerpt: string;
  readingTime: string;
}

interface GitHubProfile {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

interface HomeClientProps {
  posts: Post[];
  profile: GitHubProfile | null;
}

export default function HomeClient({ posts, profile }: HomeClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const latestPost = posts[0];

  const categories = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredPosts = posts.filter((post) => {
    const categoryMatch =
      selectedCategory === "전체" || post.category === selectedCategory;

    if (selectedDate) {
      const postDate = post.date.split(" ")[0];
      return categoryMatch && postDate === selectedDate;
    }

    return categoryMatch;
  });

  const postsByDate = posts.reduce((acc: Record<string, Post[]>, post) => {
    const dateOnly = post.date.split(" ")[0];
    if (!acc[dateOnly]) {
      acc[dateOnly] = [];
    }
    acc[dateOnly].push(post);
    return acc;
  }, {});

  const generateMonthGrassData = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

    const startDayOfWeek = firstDay.getDay();

    const weeks = [];
    let currentWeek = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: "", count: 0, isEmpty: true, posts: [] });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dateStr = date.toISOString().split("T")[0];
      const dayPosts = postsByDate[dateStr] || [];
      const count = dayPosts.length;

      currentWeek.push({
        date: dateStr,
        count,
        isEmpty: false,
        posts: dayPosts,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({ date: "", count: 0, isEmpty: true, posts: [] });
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const monthGrassData = generateMonthGrassData();

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    const now = new Date();
    if (
      selectedYear === now.getFullYear() &&
      selectedMonth === now.getMonth()
    ) {
      return;
    }

    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth()
    );
  };

  const getGrassColor = (count: number) => {
    if (count === 0) return "bg-gray-100";
    if (count === 1) return "bg-green-200";
    if (count === 2) return "bg-green-400";
    return "bg-green-600";
  };

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6">
          {/* 최신 게시글 */}
          {latestPost && (
            <Link
              href={`/posts/${latestPost.slug}`}
              className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-purple-500 to-blue-500">
                {latestPost.thumbnail ? (
                  <Image
                    src={latestPost.thumbnail}
                    alt={latestPost.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <Image
                    src={thumbnail}
                    alt="썸네일"
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                  <span className="bg-white border border-purple-600 text-purple-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold">
                    최신 게시글
                  </span>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {latestPost.category}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {latestPost.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
                  {latestPost.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  {latestPost.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <div className="flex items-center text-gray-500">
                    <Image
                      src={calendar}
                      alt="날짜"
                      width={16}
                      height={16}
                      className="mr-1 sm:w-5 sm:h-5"
                    />
                    {latestPost.date}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Image
                      src={readingTimer}
                      alt="읽는 시간"
                      width={16}
                      height={16}
                      className="mr-1 sm:w-5 sm:h-5"
                    />
                    <span>{latestPost.readingTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* GitHub 프로필 & 잔디 */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
            {profile && (
              <>
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name}
                    width={40}
                    height={40}
                    className="sm:w-[50px] sm:h-[50px] rounded-full border-2 sm:border-4 border-purple-200"
                    unoptimized
                  />
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                      {profile.name || profile.login}
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      @{profile.login}
                    </p>
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                    {profile.bio}
                  </p>
                )}

                {/* 잔디 UI */}
                <div className="border-t pt-3 sm:pt-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      게시글 작성 활동
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={goToPreviousMonth}
                        className="p-0.5 sm:p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[70px] sm:min-w-[80px] text-center">
                        {selectedYear}년 {selectedMonth + 1}월
                      </span>
                      <button
                        onClick={goToNextMonth}
                        disabled={isCurrentMonth()}
                        className="p-0.5 sm:p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-2 sm:p-4 md:p-6 border border-gray-200">
                    {/* 요일 헤더 */}
                    <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-3 justify-center">
                      {["일", "월", "화", "수", "목", "금", "토"].map(
                        (day, idx) => (
                          <div key={idx} className="w-7 sm:w-10 text-center">
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500">
                              {day}
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    {/* 잔디 그리드 */}
                    <div className="space-y-1 sm:space-y-2">
                      {monthGrassData.map((week, weekIdx) => (
                        <div
                          key={weekIdx}
                          className="flex gap-1 sm:gap-2 justify-center"
                        >
                          {week.map((day, dayIdx) => {
                            if (day.isEmpty) {
                              return (
                                <div
                                  key={dayIdx}
                                  className="w-7 h-7 sm:w-10 sm:h-10"
                                />
                              );
                            }

                            const date = new Date(day.date);
                            const formattedDate = date.toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                weekday: "short",
                              }
                            );

                            return (
                              <div
                                key={dayIdx}
                                onClick={() => {
                                  if (day.count > 0) {
                                    setSelectedDate(
                                      selectedDate === day.date
                                        ? null
                                        : day.date
                                    );
                                    setSelectedCategory("전체");
                                  }
                                }}
                                className={`w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg transition-all hover:scale-110 hover:shadow-lg cursor-pointer flex items-center justify-center
                                  ${
                                    day.count > 0
                                      ? "hover:ring-2 hover:ring-purple-400"
                                      : ""
                                  }
                                  ${
                                    selectedDate === day.date
                                      ? "ring-2 ring-purple-600 scale-110"
                                      : ""
                                  }
                                  ${getGrassColor(day.count)}`}
                                title={`${formattedDate}\n${
                                  day.count
                                }개 게시글 작성${
                                  day.posts.length > 0
                                    ? "\n클릭하여 필터링"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`text-[10px] sm:text-xs font-medium ${
                                    day.count > 0
                                      ? "text-white"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {date.getDate()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 gap-2 sm:gap-0">
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500">
                        이번 달 총{" "}
                        {
                          Object.values(postsByDate)
                            .flat()
                            .filter((post: Post) => {
                              const postDate = new Date(
                                post.date.split(" ")[0]
                              );
                              return (
                                postDate.getMonth() === selectedMonth &&
                                postDate.getFullYear() === selectedYear
                              );
                            }).length
                        }
                        개 게시글
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                        <span>적음</span>
                        <div className="flex gap-0.5 sm:gap-1">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 rounded border border-gray-200" />
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-200 rounded" />
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded" />
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-600 rounded" />
                        </div>
                        <span>많음</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              {selectedDate ? `${selectedDate} 게시글` : "카테고리"}
            </h3>
            <span className="text-xs sm:text-sm text-gray-500">
              ({filteredPosts.length}개의 게시글)
            </span>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-purple-600 hover:text-purple-700 underline"
              >
                날짜 필터 해제
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setSelectedCategory("전체");
                setSelectedDate(null);
              }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                selectedCategory === "전체" && !selectedDate
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
              }`}
            >
              전체 ({posts.length})
            </button>
            {Object.entries(categories).map(([category, count]) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedDate(null);
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedCategory === category && !selectedDate
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
                }`}
              >
                {category} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {filteredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="relative w-full h-32 sm:h-40 md:h-48 bg-gray-100">
                {post.thumbnail ? (
                  <Image
                    src={post.thumbnail}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
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

              <div className="p-2 sm:p-3 md:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
                  <span className="text-[10px] sm:text-xs bg-purple-100 text-purple-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    {post.category}
                  </span>
                </div>

                <h2 className="text-xs sm:text-sm md:text-lg font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-4 line-clamp-2 hidden sm:block">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
                  <div className="flex items-center text-[10px] sm:text-sm text-gray-500">
                    <Image
                      src={calendar}
                      alt="날짜"
                      width={14}
                      height={14}
                      className="mr-0.5 sm:mr-1 sm:w-5 sm:h-5"
                    />
                    {post.date}
                  </div>
                  <div className="flex items-center text-[10px] sm:text-sm text-gray-500">
                    <Image
                      src={readingTimer}
                      alt="읽는 시간"
                      width={14}
                      height={14}
                      className="mr-0.5 sm:mr-1 sm:w-5 sm:h-5"
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
