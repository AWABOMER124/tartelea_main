/**
 * STEP 7 transitional note:
 * Course discovery now talks to backend-owned APIs and the backend compat bridge explicitly.
 * Do not reintroduce `@/integrations/supabase/client` here.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCourses,
  listUserCourseSubscriptionIds,
  subscribeToCourse,
  unsubscribeFromCourse,
  type Course,
} from "@/lib/backendCourses";

export type { Course } from "@/lib/backendCourses";

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: listCourses,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useFeaturedCourses = () => {
  const { data: courses, isLoading } = useCourses();

  const featuredCourses = courses
    ?.slice()
    .sort((a, b) => {
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
    queryFn: () => (userId ? listUserCourseSubscriptionIds(userId) : []),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });
};

export const useSubscribeToCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, userId }: { courseId: string; userId: string }) =>
      subscribeToCourse(courseId, userId),
    onSuccess: (_courseId, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["courseSubscriptions", userId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const useUnsubscribeFromCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, userId }: { courseId: string; userId: string }) =>
      unsubscribeFromCourse(courseId, userId),
    onSuccess: (_courseId, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["courseSubscriptions", userId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};
