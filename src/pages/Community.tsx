/**
 * STEP 2 official route:
 * `/community` is backend-owned only.
 * Legacy community remains on disk for transitional references but is no longer the primary route.
 */
import BackendCommunityPage from "@/components/community/BackendCommunityPage";

const Community = () => {
  return <BackendCommunityPage />;
};

export default Community;
