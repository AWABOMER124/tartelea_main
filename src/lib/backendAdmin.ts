import { backendRequest } from "@/lib/backendApi";
import type { PlatformRole } from "@/lib/platformRoles";

export type AdminContentType = "article" | "audio" | "video";
export type AdminContentCategory =
  | "quran"
  | "values"
  | "community"
  | "sudan_awareness"
  | "arab_awareness"
  | "islamic_awareness";
export type AdminContentDepth = "beginner" | "intermediate" | "advanced";

export interface AdminDashboardStats {
  overview: {
    totalUsers: number;
    totalContents: number;
    totalCourses: number;
    totalWorkshops: number;
    totalRooms: number;
    pendingApprovals: number;
  };
}

export interface AdminContentItem {
  id: string;
  title: string;
  description: string | null;
  type: AdminContentType;
  category: AdminContentCategory;
  depth_level: AdminContentDepth;
  url: string | null;
  access_tier?: string;
  course_id?: string | null;
  is_sudan_awareness?: boolean | null;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  created_at: string | null;
  is_verified?: boolean;
  role: PlatformRole;
  roles: PlatformRole[];
}

export interface AdminCourse {
  id: string;
  trainer_id: string;
  trainer_name: string;
  title: string;
  description: string | null;
  type: AdminContentType;
  category: string;
  depth_level: AdminContentDepth;
  url: string | null;
  is_approved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminWorkshop {
  id: string;
  title: string;
  description: string | null;
  trainer_id: string;
  trainer_name: string;
  category: string;
  scheduled_at: string;
  is_approved: boolean;
  price: number;
}

export interface AdminRoom {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  host_name: string;
  category: string;
  scheduled_at: string;
  is_approved: boolean;
  price: number;
}

interface AdminUsersResponse {
  users: AdminUser[];
}

interface AdminContentsResponse {
  contents: Array<AdminContentItem & { depth_level: string | number; media_url?: string | null }>;
}

interface AdminCoursesResponse {
  courses: Array<AdminCourse & { depth_level: string | number }>;
}

interface AdminWorkshopsResponse {
  workshops: AdminWorkshop[];
}

interface AdminRoomsResponse {
  rooms: AdminRoom[];
}

const normalizeDepthLevel = (value: string | number | null | undefined): AdminContentDepth => {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }

  if (typeof value === "number") {
    if (value <= 1) return "beginner";
    if (value === 2) return "intermediate";
    return "advanced";
  }

  return "beginner";
};

const depthToNumber = (value: AdminContentDepth) => {
  if (value === "advanced") return 3;
  if (value === "intermediate") return 2;
  return 1;
};

const normalizeContent = (content: AdminContentsResponse["contents"][number]): AdminContentItem => ({
  ...content,
  depth_level: normalizeDepthLevel(content.depth_level),
  url: content.url ?? content.media_url ?? null,
});

const normalizeCourse = (course: AdminCoursesResponse["courses"][number]): AdminCourse => ({
  ...course,
  depth_level: normalizeDepthLevel(course.depth_level),
  url: course.url ?? null,
});

export const getAdminStats = async () =>
  backendRequest<AdminDashboardStats>("/admin/stats", {
    requireAuth: true,
  });

export const listAdminContents = async () => {
  const response = await backendRequest<AdminContentsResponse>("/admin/contents", {
    requireAuth: true,
  });

  return (response.contents || []).map(normalizeContent);
};

export const createAdminContent = async (payload: {
  title: string;
  description?: string;
  type: AdminContentType;
  category: AdminContentCategory;
  depth_level: AdminContentDepth;
  url?: string;
  is_sudan_awareness?: boolean;
}) =>
  backendRequest<{ content: AdminContentItem }>("/admin/contents", {
    method: "POST",
    requireAuth: true,
    body: {
      title: payload.title,
      description: payload.description || null,
      type: payload.type,
      category: payload.category,
      depth_level: depthToNumber(payload.depth_level),
      media_url: payload.url || null,
      access_tier: "free",
      is_sudan_awareness: Boolean(payload.is_sudan_awareness),
    },
  });

export const updateAdminContent = async (
  contentId: string,
  payload: {
    title: string;
    description?: string;
    type: AdminContentType;
    category: AdminContentCategory;
    depth_level: AdminContentDepth;
    url?: string;
    is_sudan_awareness?: boolean;
  },
) =>
  backendRequest<{ content: AdminContentItem }>(`/admin/contents/${contentId}`, {
    method: "PUT",
    requireAuth: true,
    body: {
      title: payload.title,
      description: payload.description || null,
      type: payload.type,
      category: payload.category,
      depth_level: depthToNumber(payload.depth_level),
      media_url: payload.url || null,
      access_tier: "free",
      is_sudan_awareness: Boolean(payload.is_sudan_awareness),
    },
  });

export const deleteAdminContent = async (contentId: string) =>
  backendRequest<{ id: string }>(`/admin/contents/${contentId}`, {
    method: "DELETE",
    requireAuth: true,
  });

export const listAdminUsers = async () => {
  const response = await backendRequest<AdminUsersResponse>("/admin/users", {
    requireAuth: true,
  });

  return response.users || [];
};

export const updateAdminUserRoles = async (userId: string, roles: PlatformRole[]) =>
  backendRequest<{ user: AdminUser }>(`/admin/users/${userId}/roles`, {
    method: "PUT",
    requireAuth: true,
    body: {
      roles,
    },
  });

export const listAdminCourses = async () => {
  const response = await backendRequest<AdminCoursesResponse>("/admin/courses", {
    requireAuth: true,
  });

  return (response.courses || []).map(normalizeCourse);
};

export const updateAdminCourseApproval = async (courseId: string, isApproved: boolean) =>
  backendRequest<{ course: AdminCourse }>(`/admin/courses/${courseId}/approval`, {
    method: "PATCH",
    requireAuth: true,
    body: {
      is_approved: isApproved,
    },
  });

export const listAdminWorkshops = async () => {
  const response = await backendRequest<AdminWorkshopsResponse>("/admin/workshops", {
    requireAuth: true,
  });

  return response.workshops || [];
};

export const updateAdminWorkshopApproval = async (workshopId: string, isApproved: boolean) =>
  backendRequest<{ workshop: AdminWorkshop }>(`/admin/workshops/${workshopId}/approval`, {
    method: "PATCH",
    requireAuth: true,
    body: {
      is_approved: isApproved,
    },
  });

export const listAdminRooms = async () => {
  const response = await backendRequest<AdminRoomsResponse>("/admin/rooms", {
    requireAuth: true,
  });

  return response.rooms || [];
};

export const updateAdminRoomApproval = async (roomId: string, isApproved: boolean) =>
  backendRequest<{ room: AdminRoom }>(`/admin/rooms/${roomId}/approval`, {
    method: "PATCH",
    requireAuth: true,
    body: {
      is_approved: isApproved,
    },
  });
