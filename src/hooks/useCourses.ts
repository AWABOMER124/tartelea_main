import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ContentType = Database["public"]["Enums"]["content_type"];
type ContentCategory = Database["public"]["Enums"]["content_category"];
type DepthLevel = Database["public"]["Enums"]["depth_level"];

export interface Course {
  id: string;
  title: string;
  description: string | null;
  type: ContentType;
  category: ContentCategory;
  depth_level: DepthLevel;
  url: string | null;
  trainer_id: string;
  trainer_name?: string;
  subscriber_count: number;
  avg_rating: number;
  rating_count: number;
}

// Fetch all approved courses with trainer names and stats
const fetchCourses = async (): Promise<Course[]> => {
  // Single query for courses
  const { data: coursesData, error } = await supabase
    .from("trainer_courses")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!coursesData || coursesData.length === 0) return [];

  // Batch fetch trainer names
  const trainerIds = [...new Set(coursesData.map((c) => c.trainer_id))];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", trainerIds);

  const profilesMap = new Map(
    profilesData?.map((p) => [p.id, p.full_name]) || []
  );

  // Fetch subscription counts from public view
  const { data: subsData } = await supabase
    .from("course_subscriptions_public")
    .select("course_id, subscriber_count");

  const subCounts: Record<string, number> = {};
  subsData?.forEach((sub) => {
    if (sub.course_id) {
      subCounts[sub.course_id] = sub.subscriber_count || 0;
    }
  });

  // Fetch ratings from public view
  const { data: ratingsData } = await supabase
    .from("course_ratings_public")
    .select("course_id, rating");

  const ratingStats: Record<string, { sum: number; count: number }> = {};
  ratingsData?.forEach((r) => {
    if (r.course_id) {
      if (!ratingStats[r.course_id]) {
        ratingStats[r.course_id] = { sum: 0, count: 0 };
      }
      ratingStats[r.course_id].sum += r.rating || 0;
      ratingStats[r.course_id].count += 1;
    }
  });

  return coursesData.map((course) => {
    const stats = ratingStats[course.id] || { sum: 0, count: 0 };
    return {
      ...course,
      trainer_name: profilesMap.get(course.trainer_id) || "مدرب",
      subscriber_count: subCounts[course.id] || 0,
      avg_rating: stats.count > 0 ? Math.round((stats.sum / stats.count) * 10) / 10 : 0,
      rating_count: stats.count,
    };
  });
};

// Fetch user subscriptions
const fetchUserSubscriptions = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from("course_subscriptions")
    .select("course_id")
    .eq("user_id", userId);

  return data?.map((s) => s.course_id) || [];
};

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
};

export const useFeaturedCourses = () => {
  const { data: courses, isLoading } = useCourses();

  // Sort by popularity and take top 4
  const featuredCourses = courses
    ?.sort((a, b) => {
      const scoreA = a.subscriber_count * 2 + a.avg_rating * 10;
      const scoreB = b.subscriber_count * 2 + b.avg_rating * 10;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  return { courses: featuredCourses || [], isLoading };
};

export const useUserCourseSubscriptions = (userId: string | null) => {
  return useQuery({
    queryKey: ["courseSubscriptions", userId],
    queryFn: () => (userId ? fetchUserSubscriptions(userId) : []),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useSubscribeToCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, userId }: { courseId: string; userId: string }) => {
      const { error } = await supabase
        .from("course_subscriptions")
        .insert({ course_id: courseId, user_id: userId });

      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["courseSubscriptions", userId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const useUnsubscribeFromCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, userId }: { courseId: string; userId: string }) => {
      const { error } = await supabase
        .from("course_subscriptions")
        .delete()
        .eq("course_id", courseId)
        .eq("user_id", userId);

      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["courseSubscriptions", userId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};
