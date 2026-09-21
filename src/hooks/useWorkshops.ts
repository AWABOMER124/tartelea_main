import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { joinWorkshop, leaveWorkshop, listUserWorkshopParticipations, listWorkshops } from "@/lib/backendWorkshops";

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
const fetchWorkshops = async (): Promise<Workshop[]> => listWorkshops();

const fetchUserParticipations = async (userId: string): Promise<string[]> =>
  listUserWorkshopParticipations(userId);

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
      await joinWorkshop(workshopId, userId);
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
      await leaveWorkshop(workshopId, userId);
      return workshopId;
    },
    onSuccess: (workshopId, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["workshopParticipations", userId] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });
};
