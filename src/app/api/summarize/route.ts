import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: "",
});

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  conclusion: string;
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "내용이 없습니다." }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `다음 블로그 글을 분석하여 구조화된 요약을 작성해주세요.

응답은 반드시 아래 JSON 형식으로만 작성해주세요:

{
  "summary": "전체 내용을 2-3문장으로 요약한 핵심 내용",
  "keyPoints": [
    "핵심 포인트 1 (한 문장)",
    "핵심 포인트 2 (한 문장)",
    "핵심 포인트 3 (한 문장)",
    "핵심 포인트 4 (한 문장)",
    "핵심 포인트 5 (한 문장)"
  ],
  "conclusion": "글의 결론이나 시사점을 1-2문장으로 요약"
}

주의사항:
- summary: 글의 전체적인 주제와 목적을 간결하게 설명
- keyPoints: 5-7개의 구체적인 핵심 내용 (각각 한 문장으로)
- conclusion: 독자가 얻을 수 있는 인사이트나 실행 가능한 결론
- 반드시 JSON 형식으로만 응답하고 다른 설명은 추가하지 마세요

블로그 글:
${content.substring(0, 100000)}`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // JSON 파싱 시도
    try {
      // JSON 블록 추출 (```json ... ``` 형식 처리)
      let jsonText = responseText.trim();

      // 마크다운 코드 블록 제거
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
      }

      const parsed: unknown = JSON.parse(jsonText);

      // 타입 가드 함수
      const isSummaryResponse = (obj: unknown): obj is SummaryResponse => {
        return (
          typeof obj === "object" &&
          obj !== null &&
          "summary" in obj &&
          "keyPoints" in obj &&
          "conclusion" in obj &&
          typeof (obj as SummaryResponse).summary === "string" &&
          Array.isArray((obj as SummaryResponse).keyPoints) &&
          typeof (obj as SummaryResponse).conclusion === "string"
        );
      };

      // 응답 검증
      if (!isSummaryResponse(parsed)) {
        throw new Error("Invalid response format");
      }

      return NextResponse.json({
        summary: parsed.summary,
        keyPoints: parsed.keyPoints,
        conclusion: parsed.conclusion,
      });
    } catch (parseError) {
      console.error("JSON 파싱 실패:", parseError);
      console.error("원본 응답:", responseText);

      // 파싱 실패 시 기본 형식으로 반환
      return NextResponse.json({
        summary: responseText.substring(0, 500),
        keyPoints: ["요약 정보를 처리하는 중 문제가 발생했습니다.", "원본 글을 참고해주세요."],
        conclusion: "자세한 내용은 원본 글을 확인해주세요.",
      });
    }
  } catch (error) {
    console.error("요약 실패:", error);
    const errorMessage = error instanceof Error ? error.message : "요약 중 오류가 발생했습니다.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
