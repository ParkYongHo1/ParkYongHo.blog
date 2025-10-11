import { NextRequest } from "next/server";
import { extractContentImages } from "@/lib/github";

export const parseFormData = async (request: NextRequest) => {
  const formData = await request.formData();
  return {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    category: formData.get("category") as string,
    tags: formData.get("tags") as string,
    thumbnailFile: formData.get("thumbnail") as File | null,
    contentImages: extractContentImages(formData),
  };
};
