export const replaceImageUrl = (
  content: string,
  tempId: string,
  url: string
): string => {
  const escapedTempId = tempId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\(${escapedTempId}\\)`, "g");
  return content.replace(regex, `(${url})`);
};
