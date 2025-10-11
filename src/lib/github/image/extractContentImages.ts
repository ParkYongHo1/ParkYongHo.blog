export const extractContentImages = (formData: FormData) => {
  const contentImageCount = parseInt(
    (formData.get("contentImageCount") as string) || "0"
  );
  const images: Array<{ file: File; id: string }> = [];

  for (let i = 0; i < contentImageCount; i++) {
    const file = formData.get(`contentImage_${i}`) as File;
    const id = formData.get(`contentImageId_${i}`) as string;
    if (file && id) {
      images.push({ file, id });
    }
  }
  return images;
};
