// src/app/api/github/profile/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get("type") || "profile";

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;

    if (!GITHUB_TOKEN || !GITHUB_OWNER) {
      return NextResponse.json(
        { error: "GitHub 설정이 올바르지 않습니다." },
        { status: 500 }
      );
    }

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    };

    let apiUrl: string;
    let responseData: any;

    switch (dataType) {
      case "profile":
        apiUrl = `https://api.github.com/users/${GITHUB_OWNER}`;
        break;

      case "events":
        // "Add post"로 시작하는 커밋만 가져오기
        apiUrl = `https://api.github.com/users/${GITHUB_OWNER}/events/public?per_page=100`;
        break;

      case "contributions":
        return await getPostContributions(GITHUB_TOKEN, GITHUB_OWNER);

      default:
        return NextResponse.json(
          { error: "잘못된 데이터 타입입니다." },
          { status: 400 }
        );
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `GitHub API 오류: ${errorData.message}` },
        { status: response.status }
      );
    }

    responseData = await response.json();

    // events 타입인 경우 "Add post"로 시작하는 커밋만 필터링
    if (dataType === "events") {
      responseData = responseData.filter((event: any) => {
        if (event.type === "PushEvent") {
          return event.payload.commits?.some((commit: any) =>
            commit.message.startsWith("Add post")
          );
        }
        return false;
      });
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      type: dataType,
    });
  } catch (error) {
    console.error("GitHub 프로필 API 오류:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// "Add post" 커밋만 포함하는 기여도 그래프 데이터
async function getPostContributions(token: string, username: string) {
  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    if (response.ok) {
      const data = await response.json();

      // "Add post" 커밋만 카운트 (실제로는 events API에서 날짜별로 집계해야 함)
      const eventsResponse = await fetch(
        `https://api.github.com/users/${username}/events/public?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (eventsResponse.ok) {
        const events = await eventsResponse.json();

        // "Add post" 커밋을 날짜별로 집계
        const postCommitsByDate = new Map<string, number>();

        events.forEach((event: any) => {
          if (event.type === "PushEvent") {
            const date = event.created_at.split("T")[0];
            const postCommits = event.payload.commits?.filter((commit: any) =>
              commit.message.startsWith("Add post")
            );

            if (postCommits && postCommits.length > 0) {
              postCommitsByDate.set(
                date,
                (postCommitsByDate.get(date) || 0) + postCommits.length
              );
            }
          }
        });

        // 기여도 달력에 "Add post" 커밋만 반영
        const calendar =
          data.data.user.contributionsCollection.contributionCalendar;
        calendar.weeks.forEach((week: any) => {
          week.contributionDays.forEach((day: any) => {
            day.postCount = postCommitsByDate.get(day.date) || 0;
          });
        });

        return NextResponse.json({
          success: true,
          data: calendar,
          type: "contributions",
        });
      }
    }

    return NextResponse.json(
      { error: "기여도 데이터를 가져올 수 없습니다." },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "기여도 데이터 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
