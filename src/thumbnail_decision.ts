export type ThumbnailSize = { width: number; height: number };

export function thumbnailSize(propertyType: string): ThumbnailSize {
  if (propertyType === "listing") return { width: 1200, height: 800 };
  if (propertyType === "inspection") return { width: 800, height: 600 };
  return { width: 640, height: 480 };
}
