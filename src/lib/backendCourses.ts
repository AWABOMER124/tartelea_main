/**
 * STEP 7 transition note:
 * Course discovery still reads a few legacy/public compatibility tables.
 * Mutations that change subscription ownership are routed into backend subscription services.
 * Do not add new direct Supabase-style access here; close remaining legacy reads over time.
 */
import {
  compatDelete,
  compatInsert,
  compatSelect,
  compatUpdate,
  uploadCompatFile,
  type CompatFilter,
} from "@/lib/backendCompat";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  type: "article" | "audio" | "video";
  category: string;
  depth_level: "beginner" | "intermediate" | "advanced";
  url: string | null;
  trainer_id: string;
  trainer_name?: string;
  subscriber_count: number;
  avg_rating: number;
  rating_count: number;
}

export interface CourseComment {
  id: string;
  body: string;
  author_id: string;
  author_name?: string;
  created_at: string;
  parent_id: string | null;
}

export interface CourseChatMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  author_name?: string;
  avatar_url?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  type: "article" | "audio" | "video";
  category: string;
  depth_level: "beginner" | "intermediate" | "advanced";
  url: string | null;
  trainer_id: string;
}

interface PublicProfileRow {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

interface CourseSubscriptionCountRow {
  course_id: string;
  subscriber_count: number;
}

interface CourseRatingRow {
  course_id: string;
  rating: number;
}

interface CourseProgressRow {
  id: string;
  progress_percent: number;
  completed_at: string | null;
}

const toArray = <T>(value: T[] | T | null | undefined): T[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [value];
};

const buildProfileMap = (profiles: PublicProfileRow[]) =>
  new Map(profiles.map((profile) => [profile.id, profile]));

const getProfilesForIds = async (ids: string[]) => {
  if (ids.length === 0) {
    return new Map<string, PublicProfileRow>();
  }

  const response = await compatSelect<PublicProfileRow[]>("profiles", {
    filters: [{ column: "id", operator: "in", value: ids }],
  });

  return buildProfileMap(toArray(response.data));
};

const loadCourseSubscriptionCounts = async () => {
  const response = await compatSelect<CourseSubscriptionCountRow[]>("course_subscriptions_public");
  return toArray(response.data).reduce<Record<string, number>>((acc, row) => {
    acc[row.course_id] = row.subscriber_count || 0;
    return acc;
  }, {});
};

const loadCourseRatingStats = async () => {
  const response = await compatSelect<CourseRatingRow[]>("course_ratings_public");

  return toArray(response.data).reduce<Record<string, { sum: number; count: number }>>((acc, row) => {
    if (!acc[row.course_id]) {
      acc[row.course_id] = { sum: 0, count: 0 };
    }

    acc[row.course_id].sum += row.rating || 0;
    acc[row.course_id].count += 1;
    return acc;
  }, {});
};

export const listCourses = async (): Promise<Course[]> => {
  /**
   * STEP 7 transitional note:
   * Course discovery still reads `trainer_courses` and legacy public views through the backend compat bridge.
   * Subscription ownership remains backend-only because course_subscriptions mutations are mapped into SubscriptionService.
   */
  const coursesResponse = await compatSelect<CourseRow[]>("trainer_courses", {
    filters: [{ column: "is_approved", operator: "eq", value: true }],
    order: [{ column: "created_at", ascending: false }],
  });

  const courses = toArray(coursesResponse.data);
  if (courses.length === 0) {
    return [];
  }

  const trainerIds = [...new Set(courses.map((course) => course.trainer_id))];
  const [profilesMap, subscriptionCounts, ratingStats] = await Promise.all([
    getProfilesForIds(trainerIds),
    loadCourseSubscriptionCounts(),
    loadCourseRatingStats(),
  ]);

  return courses.map((course) => {
    const rating = ratingStats[course.id] || { sum: 0, count: 0 };

    return {
      ...course,
      trainer_name: profilesMap.get(course.trainer_id)?.full_name || "مدرب",
      subscriber_count: subscriptionCounts[course.id] || 0,
      avg_rating: rating.count > 0 ? Math.round((rating.sum / rating.count) * 10) / 10 : 0,
      rating_count: rating.count,
    };
  });
};

export const listUserCourseSubscriptionIds = async (userId: string) => {
  const response = await compatSelect<Array<{ course_id: string }>>("course_subscriptions", {
    filters: [{ column: "user_id", operator: "eq", value: userId }],
  });

  return toArray(response.data).map((subscription) => subscription.course_id);
};

export const subscribeToCourse = async (courseId: string, userId: string) => {
  await compatInsert("course_subscriptions", { course_id: courseId, user_id: userId });
  return courseId;
};

export const unsubscribeFromCourse = async (courseId: string, userId: string) => {
  await compatDelete("course_subscriptions", [
    { column: "course_id", operator: "eq", value: courseId },
    { column: "user_id", operator: "eq", value: userId },
  ]);
  return courseId;
};

export const getCourseDetail = async (courseId: string, userId: string | null) => {
  const courseResponse = await compatSelect<CourseRow | null>("trainer_courses", {
    filters: [{ column: "id", operator: "eq", value: courseId }],
    maybeSingle: true,
  });

  if (!courseResponse.data) {
    return null;
  }

  const [profileMap, subscriptionCounts, ratingsResponse, commentsResponse, userSubscriptionResponse, userRatingResponse] =
    await Promise.all([
      getProfilesForIds([courseResponse.data.trainer_id]),
      loadCourseSubscriptionCounts(),
      compatSelect<CourseRatingRow[]>("course_ratings_public", {
        filters: [{ column: "course_id", operator: "eq", value: courseId }],
      }),
      compatSelect<CourseComment[]>("course_comments", {
        filters: [{ column: "course_id", operator: "eq", value: courseId }],
        order: [{ column: "created_at", ascending: false }],
      }),
      userId
        ? compatSelect<{ id: string } | null>("course_subscriptions", {
            filters: [
              { column: "course_id", operator: "eq", value: courseId },
              { column: "user_id", operator: "eq", value: userId },
            ],
            maybeSingle: true,
          })
        : Promise.resolve({ data: null }),
      userId
        ? compatSelect<{ rating: number } | null>("course_ratings", {
            filters: [
              { column: "course_id", operator: "eq", value: courseId },
              { column: "user_id", operator: "eq", value: userId },
            ],
            maybeSingle: true,
          })
        : Promise.resolve({ data: null }),
    ]);

  const ratings = toArray(ratingsResponse.data);
  const comments = toArray(commentsResponse.data);
  const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
  const commentProfiles = await getProfilesForIds(authorIds);

  const avgRating = ratings.length
    ? Math.round((ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / ratings.length) * 10) / 10
    : 0;

  return {
    course: {
      ...courseResponse.data,
      trainer_name: profileMap.get(courseResponse.data.trainer_id)?.full_name || "مدرب",
      subscriber_count: subscriptionCounts[courseId] || 0,
      avg_rating: avgRating,
      rating_count: ratings.length,
    },
    comments: comments.map((comment) => ({
      ...comment,
      author_name: commentProfiles.get(comment.author_id)?.full_name || "مستخدم",
    })),
    isSubscribed: Boolean(userSubscriptionResponse.data),
    userRating: userRatingResponse.data?.rating || 0,
  };
};

export const submitCourseRating = async (
  courseId: string,
  userId: string,
  rating: number,
  hasExistingRating: boolean,
) => {
  if (hasExistingRating) {
    await compatUpdate("course_ratings", { rating }, [
      { column: "course_id", operator: "eq", value: courseId },
      { column: "user_id", operator: "eq", value: userId },
    ]);
    return;
  }

  await compatInsert("course_ratings", {
    course_id: courseId,
    user_id: userId,
    rating,
  });
};

export const submitCourseComment = async (courseId: string, userId: string, body: string) => {
  await compatInsert("course_comments", {
    course_id: courseId,
    author_id: userId,
    body,
  });
};

export const getCourseProgress = async (courseId: string, userId: string) => {
  const response = await compatSelect<CourseProgressRow | null>("course_progress", {
    filters: [
      { column: "course_id", operator: "eq", value: courseId },
      { column: "user_id", operator: "eq", value: userId },
    ],
    maybeSingle: true,
  });

  return response.data;
};

export const saveCourseProgress = async (courseId: string, userId: string, progressPercent: number) => {
  const existing = await getCourseProgress(courseId, userId);

  if (existing?.id) {
    await compatUpdate("course_progress", {
      progress_percent: progressPercent,
      last_accessed_at: new Date().toISOString(),
      completed_at: progressPercent === 100 ? new Date().toISOString() : null,
    }, [{ column: "id", operator: "eq", value: existing.id }]);
    return;
  }

  await compatInsert("course_progress", {
    course_id: courseId,
    user_id: userId,
    progress_percent: progressPercent,
    completed_at: progressPercent === 100 ? new Date().toISOString() : null,
  });
};

export const listCourseChatMessages = async (courseId: string) => {
  const response = await compatSelect<CourseChatMessage[]>("course_chat_messages", {
    filters: [{ column: "course_id", operator: "eq", value: courseId }],
    order: [{ column: "created_at", ascending: true }],
    limit: 100,
  });

  const messages = toArray(response.data);
  const userIds = [...new Set(messages.map((message) => message.user_id))];
  const profiles = await getProfilesForIds(userIds);

  return messages.map((message) => ({
    ...message,
    author_name: profiles.get(message.user_id)?.full_name || "مستخدم",
    avatar_url: profiles.get(message.user_id)?.avatar_url || null,
  }));
};

export const sendCourseChatMessage = async (payload: {
  courseId: string;
  userId: string;
  message: string;
  attachmentFile?: File | null;
}) => {
  let attachmentUrl: string | null = null;
  let attachmentType: string | null = null;

  if (payload.attachmentFile) {
    attachmentUrl = await uploadCompatFile(payload.attachmentFile);
    attachmentType = payload.attachmentFile.type.startsWith("image/") ? "image" : "file";
  }

  await compatInsert("course_chat_messages", {
    course_id: payload.courseId,
    user_id: payload.userId,
    message: payload.message.trim() || (attachmentType === "image" ? "تم إرفاق صورة" : "تم إرفاق ملف"),
    attachment_url: attachmentUrl,
    attachment_type: attachmentType,
  });
};
