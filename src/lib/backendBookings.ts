import { backendRequest } from "@/lib/backendApi";

export interface BackendBooking {
  id: string;
  service_id: string;
  student_id: string;
  trainer_id: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | string;
  notes: string | null;
  created_at: string;
  review_id?: string | null;
  service?: {
    title: string;
    price: number;
    duration_minutes: number;
    service_type: string;
  } | null;
  student?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  trainer?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export interface BackendServiceReview {
  id: string;
  booking_id: string;
  service_id: string;
  student_id: string;
  trainer_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  student_name?: string | null;
  student_avatar?: string | null;
  service_title?: string | null;
}

export const listServiceBookings = async (scope: "trainer" | "student") => {
  const response = await backendRequest<{ data: BackendBooking[] }>("/service-bookings", {
    method: "GET",
    query: { scope },
    requireAuth: true,
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const createServiceBooking = async (payload: {
  service_id: string;
  scheduled_at: string;
  notes?: string | null;
}) =>
  backendRequest<BackendBooking>("/service-bookings", {
    method: "POST",
    body: payload,
    requireAuth: true,
  });

export const updateServiceBookingStatus = async (
  bookingId: string,
  status: "confirmed" | "cancelled" | "completed",
) =>
  backendRequest<BackendBooking>(`/service-bookings/${bookingId}/status`, {
    method: "PATCH",
    body: { status },
    requireAuth: true,
  });

export const submitServiceReview = async (
  bookingId: string,
  payload: { rating: number; review?: string | null },
) =>
  backendRequest<BackendServiceReview>(`/service-bookings/${bookingId}/review`, {
    method: "POST",
    body: payload,
    requireAuth: true,
  });

export const listServiceReviews = async (serviceId: string, limit = 10) => {
  const response = await backendRequest<{ data: BackendServiceReview[] }>(
    "/service-bookings/reviews/public",
    {
      method: "GET",
      query: { service_id: serviceId, limit },
      attachAuthToken: true,
    },
  );
  return Array.isArray(response.data) ? response.data : [];
};
