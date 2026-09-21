import { compatSelect } from "@/lib/backendCompat";
import { listBackendCommunityFeed } from "@/lib/backendCommunity";

export interface DiscoveryItem {
  id: string;
  title: string;
  type: "course" | "content";
  contentType: string;
  category: string;
  depthLevel?: string;
}

interface CourseRow {
  id: string;
  title: string;
  type: string;
  category: string;
  depth_level?: string;
  is_approved?: boolean;
  created_at?: string | null;
}

interface ContentRow {
  id: string;
  title: string;
  type: string;
  category: string;
  depth_level?: string;
  created_at?: string | null;
}

interface WorkshopRow {
  id: string;
  title: string;
  category: string;
  created_at?: string | null;
  is_approved?: boolean;
}

interface PinnedRow {
  content_id: string;
  content_type: string;
  display_order?: number | null;
  ticker_position?: string | null;
  is_active?: boolean;
}

export const searchLearningCatalog = async ({
  query,
  category,
  type,
  level,
}: {
  query: string;
  category?: string;
  type?: string;
  level?: string;
}) => {
  const courseFilters = [
    { column: "is_approved", operator: "eq" as const, value: true },
    { column: "title", operator: "ilike" as const, value: `%${query}%` },
  ];
  const contentFilters = [
    { column: "title", operator: "ilike" as const, value: `%${query}%` },
  ];

  if (category && category !== "all") {
    courseFilters.push({ column: "category", operator: "eq" as const, value: category });
    contentFilters.push({ column: "category", operator: "eq" as const, value: category });
  }
  if (type && type !== "all") {
    courseFilters.push({ column: "type", operator: "eq" as const, value: type });
    contentFilters.push({ column: "type", operator: "eq" as const, value: type });
  }
  if (level && level !== "all") {
    courseFilters.push({ column: "depth_level", operator: "eq" as const, value: level });
    contentFilters.push({ column: "depth_level", operator: "eq" as const, value: level });
  }

  const [coursesResponse, contentsResponse] = await Promise.all([
    compatSelect<CourseRow[]>("trainer_courses", { filters: courseFilters, limit: 5 }),
    compatSelect<ContentRow[]>("contents", { filters: contentFilters, limit: 5 }),
  ]);

  const courses = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
  const contents = Array.isArray(contentsResponse.data) ? contentsResponse.data : [];

  return [
    ...courses.map((course) => ({
      id: course.id,
      title: course.title,
      type: "course" as const,
      contentType: course.type,
      category: course.category,
      depthLevel: course.depth_level,
    })),
    ...contents.map((content) => ({
      id: content.id,
      title: content.title,
      type: "content" as const,
      contentType: content.type,
      category: content.category,
      depthLevel: content.depth_level,
    })),
  ] satisfies DiscoveryItem[];
};

export const listLatestLearningItems = async () => {
  const [pinnedResponse, coursesResponse, workshopsResponse] = await Promise.all([
    compatSelect<PinnedRow[]>("pinned_content", {
      filters: [
        { column: "ticker_position", operator: "eq", value: "latest" },
        { column: "is_active", operator: "eq", value: true },
      ],
      order: [{ column: "display_order", ascending: true }],
    }),
    compatSelect<CourseRow[]>("trainer_courses", {
      filters: [{ column: "is_approved", operator: "eq", value: true }],
      order: [{ column: "created_at", ascending: false }],
      limit: 5,
    }),
    compatSelect<WorkshopRow[]>("workshops", {
      filters: [{ column: "is_approved", operator: "eq", value: true }],
      order: [{ column: "created_at", ascending: false }],
      limit: 5,
    }),
  ]);

  const pinnedIds = new Set(
    (Array.isArray(pinnedResponse.data) ? pinnedResponse.data : []).map((item) => item.content_id),
  );
  const courses = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
  const workshops = Array.isArray(workshopsResponse.data) ? workshopsResponse.data : [];

  const items = [
    ...courses.map((course) => ({
      id: course.id,
      title: course.title,
      type: "course" as const,
      created_at: course.created_at || new Date().toISOString(),
      category: course.category,
      is_pinned: pinnedIds.has(course.id),
    })),
    ...workshops.map((workshop) => ({
      id: workshop.id,
      title: workshop.title,
      type: "workshop" as const,
      created_at: workshop.created_at || new Date().toISOString(),
      category: workshop.category,
      is_pinned: pinnedIds.has(workshop.id),
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return [
    ...items.filter((item) => item.is_pinned),
    ...items.filter((item) => !item.is_pinned),
  ].slice(0, 10);
};

export const listTrendingCommunityPosts = async () => {
  const feed = await listBackendCommunityFeed({ limit: 10 });
  const merged = [...(feed.pinned_items || []), ...(feed.items || [])];
  const seen = new Set<string>();

  return merged.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  }).slice(0, 10);
};
