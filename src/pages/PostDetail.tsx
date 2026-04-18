/**
 * STEP 2 official route:
 * `/community/:id` is backend-owned only.
 * Legacy detail views remain frozen on disk but are no longer the primary route target.
 */
import { useParams } from "react-router-dom";
import BackendPostDetailPage from "@/components/community/BackendPostDetailPage";

const PostDetail = () => {
  const { id = "" } = useParams<{ id: string }>();
  return <BackendPostDetailPage postId={id} />;
};

export default PostDetail;
