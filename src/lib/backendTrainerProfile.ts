import { compatSelect } from "@/lib/backendCompat";
import { getBackendProfile, type BackendProfile } from "@/lib/backendProfile";

export interface TrainerServiceRecord {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  service_type: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at?: string;
}

export interface TrainerCourseRecord {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  category: string;
  depth_level: string | number;
  is_approved: boolean;
  created_at?: string;
}

export interface TrainerWorkshopRecord {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  category: string;
  scheduled_at: string;
  is_live: boolean;
  is_approved: boolean;
  image_url?: string | null;
}

export interface TrainerPublicData {
  profile: BackendProfile;
  courses: TrainerCourseRecord[];
  workshops: TrainerWorkshopRecord[];
  services: TrainerServiceRecord[];
  stats: {
    totalStudents: number;
    totalCourses: number;
    totalWorkshops: number;
    avgRating: number;
  };
}

export const getTrainerPublicData = async (trainerId: string): Promise<TrainerPublicData | null> => {
  const profile = await getBackendProfile(trainerId);
  if (!profile.roles?.includes("trainer")) return null;

  const [coursesResponse, workshopsResponse, servicesResponse] = await Promise.all([
    compatSelect<TrainerCourseRecord[]>("trainer_courses", {
      filters: [
        { column: "trainer_id", operator: "eq", value: trainerId },
        { column: "is_approved", operator: "eq", value: true },
      ],
      order: [{ column: "created_at", ascending: false }],
    }),
    compatSelect<TrainerWorkshopRecord[]>("workshops", {
      filters: [
        { column: "host_id", operator: "eq", value: trainerId },
        { column: "is_approved", operator: "eq", value: true },
      ],
      order: [{ column: "scheduled_at", ascending: false }],
    }),
    compatSelect<TrainerServiceRecord[]>("trainer_services", {
      filters: [
        { column: "trainer_id", operator: "eq", value: trainerId },
        { column: "is_active", operator: "eq", value: true },
      ],
      order: [{ column: "created_at", ascending: false }],
    }),
  ]);

  const courses = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
  const workshops = Array.isArray(workshopsResponse.data) ? workshopsResponse.data : [];
  const services = Array.isArray(servicesResponse.data) ? servicesResponse.data : [];

  let totalStudents = 0;
  let avgRating = 0;

  if (courses.length) {
    const courseIds = courses.map((course) => course.id);
    const [subscriptionsResponse, ratingsResponse] = await Promise.all([
      compatSelect<Array<{ course_id: string }>>("course_subscriptions", {
        filters: [{ column: "course_id", operator: "in", value: courseIds }],
      }),
      compatSelect<Array<{ rating: number }>>("course_ratings_public", {
        filters: [{ column: "course_id", operator: "in", value: courseIds }],
      }),
    ]);

    const subscriptions = Array.isArray(subscriptionsResponse.data) ? subscriptionsResponse.data : [];
    const ratings = Array.isArray(ratingsResponse.data) ? ratingsResponse.data : [];
    totalStudents = subscriptions.length;
    avgRating = ratings.length
      ? Math.round((ratings.reduce((sum, row) => sum + Number(row.rating || 0), 0) / ratings.length) * 10) / 10
      : 0;
  }

  return {
    profile,
    courses,
    workshops,
    services,
    stats: {
      totalStudents,
      totalCourses: courses.length,
      totalWorkshops: workshops.length,
      avgRating,
    },
  };
};
