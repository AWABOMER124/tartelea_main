import { backendRequest } from "@/lib/backendApi";
import { compatDelete, compatInsert, compatSelect, compatUpdate } from "@/lib/backendCompat";
import { getBackendProfile, type BackendProfile } from "@/lib/backendProfile";

export type ContentType = "article" | "audio" | "video";
export type ContentCategory =
  | "quran"
  | "values"
  | "community"
  | "sudan_awareness"
  | "arab_awareness"
  | "islamic_awareness";
export type DepthLevel = "beginner" | "intermediate" | "advanced";

export interface TrainerCourseRecord {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  type: ContentType;
  category: ContentCategory;
  depth_level: DepthLevel;
  url: string | null;
  is_approved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  views_count?: number | null;
}

export interface TrainerWorkshopRecord {
  id: string;
  title: string;
  description: string | null;
  category: ContentCategory;
  scheduled_at: string;
  duration_minutes: number | null;
  is_approved: boolean | null;
  is_live: boolean | null;
  price: number | null;
  max_participants: number | null;
  image_url: string | null;
}

export interface TrainerRoomRecord {
  id: string;
  title: string;
  description: string | null;
  category: ContentCategory;
  scheduled_at: string;
  duration_minutes: number | null;
  is_approved: boolean | null;
  is_live: boolean | null;
  price: number | null;
  max_participants: number | null;
  access_type: string;
}

export interface TrainerDashboardData {
  profile: BackendProfile;
  courses: TrainerCourseRecord[];
  workshops: TrainerWorkshopRecord[];
  rooms: TrainerRoomRecord[];
}

const rows = <T>(value: T[] | T | null | undefined): T[] =>
  Array.isArray(value) ? value : value ? [value] : [];

export const getTrainerDashboardData = async (trainerId: string): Promise<TrainerDashboardData> => {
  const [profile, coursesResponse, workshopsResponse, roomsResponse] = await Promise.all([
    getBackendProfile(trainerId),
    compatSelect<TrainerCourseRecord[]>("trainer_courses", {
      filters: [{ column: "trainer_id", operator: "eq", value: trainerId }],
      order: [{ column: "created_at", ascending: false }],
    }),
    compatSelect<TrainerWorkshopRecord[]>("workshops", {
      filters: [{ column: "host_id", operator: "eq", value: trainerId }],
      order: [{ column: "scheduled_at", ascending: false }],
    }),
    compatSelect<TrainerRoomRecord[]>("rooms", {
      filters: [{ column: "host_id", operator: "eq", value: trainerId }],
      order: [{ column: "scheduled_at", ascending: false }],
    }),
  ]);

  return {
    profile,
    courses: rows(coursesResponse.data),
    workshops: rows(workshopsResponse.data),
    rooms: rows(roomsResponse.data),
  };
};

export const createTrainerCourse = async (
  trainerId: string,
  payload: Omit<TrainerCourseRecord, "id" | "trainer_id" | "is_approved" | "created_at" | "updated_at">,
) =>
  compatInsert("trainer_courses", {
    trainer_id: trainerId,
    ...payload,
  });

export const updateTrainerCourse = async (
  courseId: string,
  payload: Partial<Pick<TrainerCourseRecord, "title" | "description" | "type" | "category" | "depth_level" | "url">>,
) =>
  compatUpdate(
    "trainer_courses",
    { ...payload, updated_at: new Date().toISOString() },
    [{ column: "id", operator: "eq", value: courseId }],
  );

export const deleteTrainerCourse = async (courseId: string) =>
  compatDelete("trainer_courses", [
    { column: "id", operator: "eq", value: courseId },
  ]);

export const deleteTrainerWorkshop = async (workshopId: string) =>
  compatDelete("workshops", [
    { column: "id", operator: "eq", value: workshopId },
  ]);

export const deleteTrainerRoom = async (roomId: string) =>
  backendRequest<{ id: string }>(`/sessions/${roomId}`, {
    method: "DELETE",
    requireAuth: true,
  });

export interface TrainerStatsSnapshot {
  totalSubscribers: number;
  totalComments: number;
  totalViews: number;
  avgRating: number;
  ratingCount: number;
  completedCourses: number;
}

export const getTrainerStats = async (trainerId: string): Promise<TrainerStatsSnapshot> => {
  const coursesResponse = await compatSelect<Array<{ id: string; views_count?: number | null }>>("trainer_courses", {
    filters: [
      { column: "trainer_id", operator: "eq", value: trainerId },
      { column: "is_approved", operator: "eq", value: true },
    ],
  });
  const courses = rows(coursesResponse.data);
  if (!courses.length) {
    return {
      totalSubscribers: 0,
      totalComments: 0,
      totalViews: 0,
      avgRating: 0,
      ratingCount: 0,
      completedCourses: 0,
    };
  }

  const courseIds = courses.map((course) => course.id);
  const [subsResponse, commentsResponse, ratingsResponse, progressResponse] = await Promise.all([
    compatSelect<Array<{ id: string }>>("course_subscriptions", {
      filters: [{ column: "course_id", operator: "in", value: courseIds }],
    }),
    compatSelect<Array<{ id: string }>>("course_comments", {
      filters: [{ column: "course_id", operator: "in", value: courseIds }],
    }),
    compatSelect<Array<{ rating: number }>>("course_ratings_public", {
      filters: [{ column: "course_id", operator: "in", value: courseIds }],
    }),
    compatSelect<Array<{ id: string }>>("course_progress", {
      filters: [
        { column: "course_id", operator: "in", value: courseIds },
        { column: "progress_percent", operator: "eq", value: 100 },
      ],
    }),
  ]);

  const ratings = rows(ratingsResponse.data);
  const ratingTotal = ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0);

  return {
    totalSubscribers: rows(subsResponse.data).length,
    totalComments: rows(commentsResponse.data).length,
    totalViews: courses.reduce((sum, item) => sum + Number(item.views_count || 0), 0),
    avgRating: ratings.length ? Math.round((ratingTotal / ratings.length) * 10) / 10 : 0,
    ratingCount: ratings.length,
    completedCourses: rows(progressResponse.data).length,
  };
};

export interface TrainerAnalyticsSnapshot {
  courses: Array<{ id: string; title: string }>;
  subscriptions: Array<{ course_id: string; subscribed_at: string | null }>;
  ratings: Array<{ course_id: string; rating: number; created_at: string | null }>;
}

export const getTrainerAnalytics = async (trainerId: string): Promise<TrainerAnalyticsSnapshot> => {
  const coursesResponse = await compatSelect<Array<{ id: string; title: string }>>("trainer_courses", {
    filters: [
      { column: "trainer_id", operator: "eq", value: trainerId },
      { column: "is_approved", operator: "eq", value: true },
    ],
  });
  const courses = rows(coursesResponse.data);
  if (!courses.length) return { courses: [], subscriptions: [], ratings: [] };

  const courseIds = courses.map((course) => course.id);
  const [subsResponse, ratingsResponse] = await Promise.all([
    compatSelect<Array<{ course_id: string; subscribed_at: string | null }>>("course_subscriptions", {
      filters: [{ column: "course_id", operator: "in", value: courseIds }],
      order: [{ column: "subscribed_at", ascending: true }],
    }),
    compatSelect<Array<{ course_id: string; rating: number; created_at: string | null }>>("course_ratings_public", {
      filters: [{ column: "course_id", operator: "in", value: courseIds }],
      order: [{ column: "created_at", ascending: true }],
    }),
  ]);

  return {
    courses,
    subscriptions: rows(subsResponse.data),
    ratings: rows(ratingsResponse.data),
  };
};
