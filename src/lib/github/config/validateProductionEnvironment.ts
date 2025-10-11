import { createApiError } from "@/lib/github";

export const validateProductionEnvironment = () => {
  if (process.env.NODE_ENV === "production") {
    throw createApiError("글 작성은 개발 환경에서만 가능합니다.", 403);
  }
};
