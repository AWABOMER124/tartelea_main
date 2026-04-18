/**
 * Official community API facade for web.
 * All new community code must go through this backend-owned layer.
 */
import { backendRequest } from "@/lib/backendApi";

export interface BackendCommunityContext {
  id: string;
  type: string;
  source_system?: string;
  source_id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  visibility: string;
  membership_rule?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}

export interface BackendCommunityAuthor {
  id: string;
  name: string;
  avatar_url?: string | null;
}

export interface BackendCommunityCounts {
  comments: number;
  reactions: number;
  attachments?: number;
  replies?: number;
}

export interface BackendCommunityViewerState {
  liked: boolean;
  can_comment?: boolean;
  can_reply?: boolean;
  can_moderate?: boolean;
  can_manage?: boolean;
}

export interface BackendCommunityComment {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  depth: number;
  body: string;
  status: string;
  created_at: string;
  updated_at?: string | null;
  edited_at?: string | null;
  author: BackendCommunityAuthor;
  counts: BackendCommunityCounts;
  viewer_state: BackendCommunityViewerState;
  replies: BackendCommunityComment[];
}

export interface BackendCommunityPost {
  id: string;
  title?: string | null;
  body: string;
  kind: string;
  status: string;
  is_locked: boolean;
  created_at: string;
  updated_at?: string | null;
  last_activity_at?: string | null;
  edited_at?: string | null;
  primary_context: BackendCommunityContext;
  author: BackendCommunityAuthor;
  counts: BackendCommunityCounts;
  viewer_state: BackendCommunityViewerState;
  comments?: BackendCommunityComment[];
  scopes?: Array<BackendCommunityContext & { is_primary?: boolean }>;
  pin?: {
    id: string;
    sort_order?: number | null;
    ends_at?: string | null;
  } | null;
}

export interface BackendCommunitySessionQuestion {
  id: string;
  body: string;
  status: "pending" | "approved" | "answered" | "rejected" | "archived";
  is_anonymous: boolean;
  answer_text?: string | null;
  rejected_reason?: string | null;
  asked_by?: BackendCommunityAuthor | null;
  addressed_to?: BackendCommunityAuthor | null;
  answered_by?: BackendCommunityAuthor | null;
  context: BackendCommunityContext;
  viewer_state: BackendCommunityViewerState;
  created_at: string;
  updated_at?: string | null;
  answered_at?: string | null;
  approved_at?: string | null;
}

export type BackendCommunityReportReasonCode =
  | "spam"
  | "abuse"
  | "off_topic"
  | "misinformation"
  | "copyright"
  | "other";

interface BackendContextsResponse {
  contexts: BackendCommunityContext[];
}

export interface BackendFeedResponse {
  pinned_items: BackendCommunityPost[];
  items: BackendCommunityPost[];
  next_cursor?: string | null;
}

interface BackendPostResponse {
  post: BackendCommunityPost;
}

interface BackendReactionResponse {
  reaction: {
    target_type: "post" | "comment";
    target_id: string;
    reaction_type: "like";
    active: boolean;
    count: number;
  };
}

interface BackendCommentResponse {
  comment: BackendCommunityComment;
}

interface BackendReportResponse {
  report: {
    id: string;
    target_type: "post" | "comment" | "question";
    status: string;
    reason_code: BackendCommunityReportReasonCode;
    note?: string | null;
    created_at: string;
  };
}

interface BackendSessionQuestionsResponse {
  items: BackendCommunitySessionQuestion[];
  next_cursor?: string | null;
}

interface BackendSessionQuestionResponse {
  question: BackendCommunitySessionQuestion;
}

export const listBackendCommunityContexts = async () => {
  const response = await backendRequest<BackendContextsResponse>("/community/contexts");
  return response.contexts || [];
};

export const listBackendCommunityFeed = async ({
  contextId,
  cursor,
  limit,
  kind,
}: {
  contextId?: string | null;
  cursor?: string | null;
  limit?: number;
  kind?: "discussion" | "announcement";
} = {}) => {
  return backendRequest<BackendFeedResponse>("/community/feed", {
    query: {
      context_id: contextId || undefined,
      cursor: cursor || undefined,
      limit,
      kind,
    },
  });
};

export const getBackendCommunityPost = async (postId: string) => {
  const response = await backendRequest<BackendPostResponse>(`/community/posts/${postId}`);
  return response.post;
};

export const createBackendCommunityPost = async (payload: {
  primary_context_id: string;
  title?: string;
  body: string;
  kind?: "discussion" | "announcement";
  secondary_context_ids?: string[];
}) => {
  const response = await backendRequest<BackendPostResponse>("/community/posts", {
    method: "POST",
    requireAuth: true,
    body: payload,
  });

  return response.post;
};

export const reactToBackendCommunityPost = async (postId: string, active: boolean) => {
  const response = await backendRequest<BackendReactionResponse>(`/community/posts/${postId}/reaction`, {
    method: "PUT",
    requireAuth: true,
    body: {
      reaction_type: "like",
      active,
    },
  });

  return response.reaction;
};

export const reactToBackendCommunityComment = async (commentId: string, active: boolean) => {
  const response = await backendRequest<BackendReactionResponse>(`/community/comments/${commentId}/reaction`, {
    method: "PUT",
    requireAuth: true,
    body: {
      reaction_type: "like",
      active,
    },
  });

  return response.reaction;
};

export const createBackendCommunityComment = async (
  postId: string,
  body: string,
  parentCommentId?: string,
) => {
  const response = await backendRequest<BackendCommentResponse>(`/community/posts/${postId}/comments`, {
    method: "POST",
    requireAuth: true,
    body: {
      body,
      parent_comment_id: parentCommentId || null,
    },
  });

  return response.comment;
};

export const reportBackendCommunityTarget = async ({
  targetType,
  targetId,
  reasonCode,
  note,
}: {
  targetType: "post" | "comment" | "question";
  targetId: string;
  reasonCode: BackendCommunityReportReasonCode;
  note?: string;
}) => {
  const response = await backendRequest<BackendReportResponse>("/community/reports", {
    method: "POST",
    requireAuth: true,
    body: {
      target_type: targetType,
      target_id: targetId,
      reason_code: reasonCode,
      note: note?.trim() || undefined,
    },
  });

  return response.report;
};

export const listBackendSessionQuestions = async ({
  contextId,
  status,
  cursor,
  limit,
}: {
  contextId: string;
  status?: "pending" | "approved" | "answered" | "rejected" | "archived";
  cursor?: string | null;
  limit?: number;
}) => {
  return backendRequest<BackendSessionQuestionsResponse>("/community/session-questions", {
    query: {
      context_id: contextId,
      status,
      cursor: cursor || undefined,
      limit,
    },
  });
};

export const createBackendSessionQuestion = async (payload: {
  context_id: string;
  body: string;
  addressed_to_id?: string;
  is_anonymous?: boolean;
}) => {
  const response = await backendRequest<BackendSessionQuestionResponse>("/community/session-questions", {
    method: "POST",
    requireAuth: true,
    body: payload,
  });

  return response.question;
};
