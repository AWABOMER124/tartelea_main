import { backendRequest } from "@/lib/backendApi";
import type { BackendCommunityContext, BackendCommunityPost } from "@/lib/backendCommunity";

export interface AdminCommunityPost extends BackendCommunityPost {
  pending_reports_count: number;
}

export interface AdminCommunityPostsResponse {
  items: AdminCommunityPost[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminCommunityReport {
  id: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  target_type: "post" | "comment" | "question";
  reason_code: string;
  note?: string | null;
  resolution_note?: string | null;
  target_preview?: string | null;
  reporter_name?: string | null;
  assigned_to_name?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface AdminCommunityPin {
  id: string;
  context_id: string;
  context_title: string;
  post_id: string;
  post_title?: string | null;
  pinned_by: string;
  pinned_by_name?: string | null;
  reason?: string | null;
  sort_order: number;
  ends_at?: string | null;
  created_at: string;
}

interface AdminCommunityReportsResponse {
  reports: AdminCommunityReport[];
}

interface AdminCommunityPinsResponse {
  items: AdminCommunityPin[];
  total: number;
  limit: number;
  offset: number;
}

interface AdminCommunityContextsResponse {
  contexts: BackendCommunityContext[];
}

interface AdminModerationActionResponse {
  action: {
    action_type: string;
    target_type: string;
    target_id: string;
  };
}

interface AdminPinMutationResponse {
  pin: AdminCommunityPin;
}

export const listAdminCommunityPosts = async ({
  status,
  contextId,
  limit,
  offset,
}: {
  status?: "published" | "hidden" | "deleted" | "archived";
  contextId?: string;
  limit?: number;
  offset?: number;
} = {}) => {
  return backendRequest<AdminCommunityPostsResponse>("/admin/community/posts", {
    requireAuth: true,
    query: {
      status,
      context_id: contextId,
      limit,
      offset,
    },
  });
};

export const listAdminCommunityReports = async ({
  status,
  targetType,
  limit,
  offset,
}: {
  status?: "pending" | "reviewed" | "resolved" | "dismissed";
  targetType?: "post" | "comment" | "question";
  limit?: number;
  offset?: number;
} = {}) => {
  return backendRequest<AdminCommunityReportsResponse>("/admin/community/reports", {
    requireAuth: true,
    query: {
      status,
      target_type: targetType,
      limit,
      offset,
    },
  });
};

export const listAdminCommunityContexts = async () => {
  const response = await backendRequest<AdminCommunityContextsResponse>("/admin/community/contexts", {
    requireAuth: true,
  });

  return response.contexts || [];
};

export const listAdminCommunityPins = async ({
  contextId,
  limit,
  offset,
}: {
  contextId?: string;
  limit?: number;
  offset?: number;
} = {}) => {
  return backendRequest<AdminCommunityPinsResponse>("/admin/community/pins", {
    requireAuth: true,
    query: {
      context_id: contextId,
      limit,
      offset,
    },
  });
};

export const applyAdminCommunityModerationAction = async (payload: {
  action_type: "hide" | "unhide" | "delete" | "restore" | "lock" | "unlock";
  target_type: "post" | "comment";
  target_id: string;
  report_id?: string;
  reason?: string;
}) => {
  const response = await backendRequest<AdminModerationActionResponse>("/admin/community/moderation-actions", {
    method: "POST",
    requireAuth: true,
    body: payload,
  });

  return response.action;
};

export const createAdminCommunityPin = async (payload: {
  context_id: string;
  post_id: string;
  reason?: string;
  sort_order?: number;
  ends_at?: string | null;
}) => {
  const response = await backendRequest<AdminPinMutationResponse>("/admin/community/pins", {
    method: "POST",
    requireAuth: true,
    body: payload,
  });

  return response.pin;
};

export const deleteAdminCommunityPin = async (pinId: string) => {
  const response = await backendRequest<AdminPinMutationResponse>(`/admin/community/pins/${pinId}`, {
    method: "DELETE",
    requireAuth: true,
  });

  return response.pin;
};
