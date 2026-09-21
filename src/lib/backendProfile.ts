import { backendRequest } from "@/lib/backendApi";

export interface BackendProfile {
  id: string;
  email?: string | null;
  full_name: string | null;
  country: string | null;
  avatar_url: string | null;
  bio: string | null;
  experience_years?: number | null;
  specializations?: string[] | null;
  specialties?: string[] | null;
  services?: string[] | null;
  social_links?: Record<string, string> | null;
  is_public_profile?: boolean | null;
  is_verified?: boolean;
  roles?: string[];
}

export interface UpdateBackendProfileInput {
  full_name?: string;
  country?: string;
  bio?: string;
  avatar_url?: string;
  experience_years?: number;
  specializations?: string[];
  specialties?: string[];
  services?: string[];
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
