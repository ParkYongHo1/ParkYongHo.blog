import { NextResponse } from "next/server";
import axios from "axios";
import { isApiError } from "@/lib/github";

export const handleApiError = (error: unknown) => {
  if (isApiError(error)) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Axios Error
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 429) {
      return NextResponse.json(
        { error: "GitHub API 요청 한도 초과. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `GitHub API 오류: ${message}` },
      { status: status || 500 }
    );
  }
  // 일반 Error
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    { error: "서버 내부 오류가 발생했습니다." },
    { status: 500 }
  );
};
