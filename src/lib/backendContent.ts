import { compatSelect, type CompatFilter } from "@/lib/backendCompat";

export type BackendContentType = "article" | "audio" | "video";
export type BackendContentDepth = "beginner" | "intermediate" | "advanced";

export interface BackendContentItem {
  id: string;
  title: string;
  description: string | null;
  type: BackendContentType;
  category: string;
  depth_level: BackendContentDepth;
  url: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  content?: string | null;
  created_at?: string | null;
  is_sudan_awareness?: boolean | null;
}

interface LibraryFilters {
  type?: string;
  category?: string;
  depthLevel?: string;
}

const normalizeContent = (content: BackendContentItem) => ({
  ...content,
  url: content.url ?? content.media_url ?? null,
});

export const listLibraryContent = async ({
  type,
  category,
  depthLevel,
}: LibraryFilters = {}) => {
  const filters: CompatFilter[] = [];

  if (type && type !== "all") {
    filters.push({ column: "type", operator: "eq", value: type });
  }

  if (category && category !== "all") {
    filters.push({ column: "category", operator: "eq", value: category });
  }

  if (depthLevel && depthLevel !== "all") {
    filters.push({ column: "depth_level", operator: "eq", value: depthLevel });
  }

  const response = await compatSelect<BackendContentItem[]>("contents", {
    filters,
    order: [{ column: "created_at", ascending: false }],
  });

  return Array.isArray(response.data) ? response.data.map(normalizeContent) : [];
};

export const getLibraryContent = async (contentId: string) => {
  const response = await compatSelect<BackendContentItem | null>("contents", {
    filters: [{ column: "id", operator: "eq", value: contentId }],
    maybeSingle: true,
  });

  return response.data ? normalizeContent(response.data) : null;
};
