import { backendRequest } from "@/lib/backendApi";

export interface BackendProfile {
  id: string;
  email?: string | null;
  full_name: string | null;
  country: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified?: boolean;
  roles?: string[];
}

export interface UpdateBackendProfileInput {
  full_name?: string;
  country?: string;
  bio?: string;
}

export const getBackendProfile = async (userId: string) =>
  backendRequest<BackendProfile>(`/profiles/${userId}`, {
    method: "GET",
    attachAuthToken: true,
  });

export const updateBackendProfile = async (
  userId: string,
  input: UpdateBackendProfileInput,
) =>
  backendRequest<BackendProfile>(`/profiles/${userId}`, {
    method: "PUT",
    body: input,
    requireAuth: true,
  });
