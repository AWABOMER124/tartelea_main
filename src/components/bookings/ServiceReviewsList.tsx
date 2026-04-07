import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  student?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ServiceReviewsListProps {
  serviceId: string;
}

const ServiceReviewsList = ({ serviceId }: ServiceReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  const fetchReviews = async () => {
    setLoading(true);

    const { data: reviewsData } = await supabase
      .from("service_reviews")
      .select("*")
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (reviewsData && reviewsData.length > 0) {
      // Fetch student profiles
      const studentIds = reviewsData.map((r) => r.student_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", studentIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const enriched = reviewsData.map((review) => ({
        ...review,
        student: profileMap.get(review.student_id),
      }));

      setReviews(enriched);
      
      // Calculate average
      const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
      setAvgRating(Math.round(avg * 10) / 10);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-4">
      {/* Average Rating */}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                avgRating >= star
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{avgRating}</span>
        <span className="text-sm text-muted-foreground">
          ({reviews.length} تقييم)
        </span>
      </div>

      {/* Reviews List */}
      <div className="space-y-2">
        {reviews.slice(0, 3).map((review) => (
          <div key={review.id} className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {review.student?.avatar_url ? (
                  <img
                    src={review.student.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {review.student?.full_name || "مستخدم"}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3 w-3",
                          review.rating >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {review.review && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {review.review}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceReviewsList;
