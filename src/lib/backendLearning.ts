import { compatSelect } from "@/lib/backendCompat";

export interface CertificateRecord {
  id: string;
  certificate_number: string;
  issued_at: string;
  user_id: string;
  course_id: string;
  user_name?: string;
  course_title?: string;
}

export interface LearningStatsSnapshot {
  enrolledCourses: number;
  completedCourses: number;
  certificatesEarned: number;
  avgProgress: number;
  totalPoints: number;
}

const toRows = <T>(data: T[] | T | null | undefined): T[] =>
  Array.isArray(data) ? data : data ? [data] : [];

export const listUserCertificates = async (userId: string) => {
  const certsResponse = await compatSelect<CertificateRecord[]>("certificates", {
    filters: [{ column: "user_id", operator: "eq", value: userId }],
    order: [{ column: "issued_at", ascending: false }],
  });
  const certs = toRows(certsResponse.data);
  if (!certs.length) return [];

  const [profilesResponse, coursesResponse] = await Promise.all([
    compatSelect<Array<{ id: string; full_name: string | null }>>("profiles_public", {
      filters: [{ column: "id", operator: "in", value: [...new Set(certs.map((cert) => cert.user_id))] }],
    }),
    compatSelect<Array<{ id: string; title: string }>>("trainer_courses", {
      filters: [{ column: "id", operator: "in", value: [...new Set(certs.map((cert) => cert.course_id))] }],
    }),
  ]);

  const profileMap = new Map(toRows(profilesResponse.data).map((profile) => [profile.id, profile.full_name]));
  const courseMap = new Map(toRows(coursesResponse.data).map((course) => [course.id, course.title]));

  return certs.map((cert) => ({
    ...cert,
    user_name: profileMap.get(cert.user_id) || "متدرب",
    course_title: courseMap.get(cert.course_id) || "مسار",
  }));
};

export const getCertificate = async (certificateId: string) => {
  const response = await compatSelect<CertificateRecord | null>("certificates", {
    filters: [{ column: "id", operator: "eq", value: certificateId }],
    maybeSingle: true,
  });
  if (!response.data) return null;
  const enriched = await listUserCertificates(response.data.user_id);
  return enriched.find((cert) => cert.id === certificateId) || null;
};

export const getLearningStatsSnapshot = async (userId: string): Promise<LearningStatsSnapshot> => {
  const [subscriptionsResponse, progressResponse, certsResponse, ratingsResponse, commentsResponse, postsResponse] =
    await Promise.all([
      compatSelect<Array<{ course_id: string }>>("course_subscriptions", {
        filters: [{ column: "user_id", operator: "eq", value: userId }],
      }),
      compatSelect<Array<{ progress_percent: number; completed_at: string | null }>>("course_progress", {
        filters: [{ column: "user_id", operator: "eq", value: userId }],
      }),
      compatSelect<Array<{ id: string }>>("certificates", {
        filters: [{ column: "user_id", operator: "eq", value: userId }],
      }),
      compatSelect<Array<{ id: string }>>("course_ratings", {
        filters: [{ column: "user_id", operator: "eq", value: userId }],
      }),
      compatSelect<Array<{ id: string }>>("course_comments", {
        filters: [{ column: "author_id", operator: "eq", value: userId }],
      }),
      compatSelect<Array<{ id: string }>>("posts", {
        filters: [{ column: "author_id", operator: "eq", value: userId }],
      }),
    ]);

  const subscriptions = toRows(subscriptionsResponse.data);
  const progress = toRows(progressResponse.data);
  const certificates = toRows(certsResponse.data);
  const ratings = toRows(ratingsResponse.data);
  const comments = toRows(commentsResponse.data);
  const posts = toRows(postsResponse.data);

  const enrolledCourses = subscriptions.length;
  const completedCourses = progress.filter((row) => row.completed_at).length;
  const certificatesEarned = certificates.length;
  const totalProgress = progress.reduce((sum, row) => sum + Number(row.progress_percent || 0), 0);
  const avgProgress = progress.length ? Math.round(totalProgress / progress.length) : 0;

  const totalPoints =
    enrolledCourses * 10 +
    progress.reduce((sum, row) => sum + Math.floor(Number(row.progress_percent || 0) / 10) * 5, 0) +
    completedCourses * 50 +
    certificatesEarned * 100 +
    ratings.length * 5 +
    comments.length * 10 +
    posts.length * 15;

  return { enrolledCourses, completedCourses, certificatesEarned, avgProgress, totalPoints };
};
