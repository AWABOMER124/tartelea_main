import { compatInsert, compatSelect } from "@/lib/backendCompat";

export interface BackendBlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  author_id: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

interface PublicProfile {
  id: string;
  full_name: string | null;
}

const withAuthors = async (posts: BackendBlogPost[]) => {
  if (!posts.length) return posts;
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const profilesResponse = await compatSelect<PublicProfile[]>("profiles_public", {
    filters: [{ column: "id", operator: "in", value: authorIds }],
  });
  const profiles = Array.isArray(profilesResponse.data) ? profilesResponse.data : [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.full_name]));

  return posts.map((post) => ({
    ...post,
    author_name: profileMap.get(post.author_id) || "المدرسة الترتيلية",
  }));
};

export const listBlogPosts = async (category?: string) => {
  const filters = [{ column: "is_published", operator: "eq" as const, value: true }];
  if (category && category !== "all") {
    filters.push({ column: "category", operator: "eq" as const, value: category });
  }

  const response = await compatSelect<BackendBlogPost[]>("blog_posts", {
    filters,
    order: [{ column: "published_at", ascending: false }],
  });
  return withAuthors(Array.isArray(response.data) ? response.data : []);
};

export const getBlogPost = async (id: string) => {
  const response = await compatSelect<BackendBlogPost | null>("blog_posts", {
    filters: [
      { column: "id", operator: "eq", value: id },
      { column: "is_published", operator: "eq", value: true },
    ],
    maybeSingle: true,
  });
  if (!response.data) return null;
  const [post] = await withAuthors([response.data]);
  return post || null;
};

export const createBlogPost = async (payload: {
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  author_id: string;
}) =>
  compatInsert("blog_posts", {
    ...payload,
    is_published: true,
    published_at: new Date().toISOString(),
  });
