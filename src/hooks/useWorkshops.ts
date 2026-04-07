import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Workshop {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  host_name?: string;
  category: string;
  scheduled_at: string;
  duration_minutes: number;
  is_live: boolean;
  is_approved: boolean;
  price: number;
  max_participants: number;
  participant_count: number;
  image_url?: string | null;
}

// Fetch all approved upcoming workshops with host names and participant counts
const fetchWorkshops = async (): Promise<Workshop[]> => {
  const { data: workshopsData, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("is_approved", true)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  if (!workshopsData || workshopsData.length === 0) return [];

  // Batch fetch host names
  const hostIds = [...new Set(workshopsData.map((w) => w.host_id))];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", hostIds);

  const profilesMap = new Map(
    profilesData?.map((p) => [p.id, p.full_name]) || []
  );

  // Batch fetch participant counts
  const workshopIds = workshopsData.map((w) => w.id);
  const { data: participantsData } = await supabase
    .from("workshop_participants")
    .select("workshop_id")
    .in("workshop_id", workshopIds);

  const counts: Record<string, number> = {};
  participantsData?.forEach((p) => {
    counts[p.workshop_id] = (counts[p.workshop_id] || 0) + 1;
  });

  return workshopsData.map((workshop) => ({
    ...workshop,
    host_name: profilesMap.get(workshop.host_id) || "مدرب",
    participant_count: counts[workshop.id] || 0,
  }));
};

// Fetch user participations
const fetchUserParticipations = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from("workshop_participants")
    .select("workshop_id")
    .eq("user_id", userId);

  return data?.map((p) => p.workshop_id) || [];
};

export const useWorkshops = () => {
  return useQuery({
    queryKey: ["workshops"],
    queryFn: fetchWorkshops,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
  });
};

export const useUpcomingWorkshops = (limit: number = 5) => {
  const { data: workshops, isLoading } = useWorkshops();

  const upcomingWorkshops = workshops?.slice(0, limit);

  return { workshops: upcomingWorkshops || [], isLoading };
};

export const useUserWorkshopParticipations = (userId: string | null) => {
  return useQuery({
    queryKey: ["workshopParticipations", userId],
    queryFn: () => (userId ? fetchUserParticipations(userId) : []),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useJoinWorkshop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workshopId, userId }: { workshopId: string; userId: string }) => {
      const { error } = await supabase
        .from("workshop_participants")
        .insert({ workshop_id: workshopId, user_id: userId });

      if (error) throw error;
      return workshopId;
    },
    onSuccess: (workshopId, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["workshopParticipations", userId] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });
};

export const useLeaveWorkshop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workshopId, userId }: { workshopId: string; userId: string }) => {
      const { error } = await supabase
        .from("workshop_participants")
        .delete()
        .eq("workshop_id", workshopId)
        .eq("user_id", userId);

      if (error) throw error;
      return workshopId;
    },
    onSuccess: (workshopId, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["workshopParticipations", userId] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });
};
