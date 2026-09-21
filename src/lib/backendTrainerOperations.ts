import {
  compatDelete,
  compatInsert,
  compatSelect,
  compatUpdate,
} from "@/lib/backendCompat";

export interface TrainerServiceRow {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  service_type: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TrainerAvailabilityRow {
  id: string;
  trainer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface TrainerBlockedDateRow {
  id: string;
  trainer_id: string;
  blocked_date: string;
  reason: string | null;
}

export const listTrainerServices = async (trainerId: string) => {
  const response = await compatSelect<TrainerServiceRow[]>("trainer_services", {
    filters: [{ column: "trainer_id", operator: "eq", value: trainerId }],
    order: [{ column: "created_at", ascending: false }],
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const createTrainerService = async (
  trainerId: string,
  payload: Omit<TrainerServiceRow, "id" | "trainer_id" | "created_at" | "updated_at">,
) =>
  compatInsert<TrainerServiceRow>(
    "trainer_services",
    { trainer_id: trainerId, ...payload },
    { single: true },
  );

export const updateTrainerService = async (
  serviceId: string,
  payload: Partial<Omit<TrainerServiceRow, "id" | "trainer_id" | "created_at">>,
) =>
  compatUpdate<TrainerServiceRow>(
    "trainer_services",
    { ...payload, updated_at: new Date().toISOString() },
    [{ column: "id", operator: "eq", value: serviceId }],
    { single: true },
  );

export const deleteTrainerService = async (serviceId: string) =>
  compatDelete("trainer_services", [
    { column: "id", operator: "eq", value: serviceId },
  ]);

export const listTrainerAvailability = async (trainerId: string) => {
  const response = await compatSelect<TrainerAvailabilityRow[]>("trainer_availability", {
    filters: [{ column: "trainer_id", operator: "eq", value: trainerId }],
    order: [{ column: "day_of_week", ascending: true }],
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const createTrainerAvailability = async (
  trainerId: string,
  payload: Pick<TrainerAvailabilityRow, "day_of_week" | "start_time" | "end_time" | "is_active">,
) =>
  compatInsert("trainer_availability", {
    trainer_id: trainerId,
    ...payload,
  });

export const updateTrainerAvailability = async (
  id: string,
  payload: Partial<Pick<TrainerAvailabilityRow, "is_active" | "start_time" | "end_time">>,
) =>
  compatUpdate("trainer_availability", payload, [
    { column: "id", operator: "eq", value: id },
  ]);

export const deleteTrainerAvailability = async (id: string) =>
  compatDelete("trainer_availability", [
    { column: "id", operator: "eq", value: id },
  ]);

export const listTrainerBlockedDates = async (trainerId: string) => {
  const response = await compatSelect<TrainerBlockedDateRow[]>("trainer_blocked_dates", {
    filters: [
      { column: "trainer_id", operator: "eq", value: trainerId },
      {
        column: "blocked_date",
        operator: "gte",
        value: new Date().toISOString().split("T")[0],
      },
    ],
    order: [{ column: "blocked_date", ascending: true }],
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const createTrainerBlockedDate = async (
  trainerId: string,
  blockedDate: string,
  reason?: string | null,
) =>
  compatInsert("trainer_blocked_dates", {
    trainer_id: trainerId,
    blocked_date: blockedDate,
    reason: reason || null,
  });

export const deleteTrainerBlockedDate = async (id: string) =>
  compatDelete("trainer_blocked_dates", [
    { column: "id", operator: "eq", value: id },
  ]);
