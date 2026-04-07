import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import CourseProgressTracker from "@/components/courses/CourseProgressTracker";
import CourseGroupChat from "@/components/courses/CourseGroupChat";
import {
  Video,
  FileText,
  Headphones,
  Users,
  Loader2,
  CheckCircle,
  Star,
  ArrowRight,
  Send,
  MessageCircle,
  ExternalLink,
  User,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow, ar } from "@/lib/date-utils";
import type { Database } from "@/integrations/supabase/types";

type ContentType = Database["public"]["Enums"]["content_type"];

interface Course {
  id: string;
  title: string;
  description: string | null;
  type: ContentType;
  category: string;
  depth_level: string;
  url: string | null;
  trainer_id: string;
  trainer_name?: string;
  views_count: number | null;
}

interface Comment {
  id: string;
  body: string;
  author_id: string;
  author_name?: string;
  created_at: string;
  parent_id: string | null;
}

const typeIcons = {
  article: FileText,
  audio: Headphones,
  video: Video,
};

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const depthLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribing, setSubscribing] = useState(false);
  
  const [userRating, setUserRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchComments();
      incrementViews();
    }
  }, [id]);

  useEffect(() => {
    if (id && userId) {
      fetchUserData();
    }
  }, [id, userId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchCourse = async () => {
    setLoading(true);
    
    const { data: courseData, error } = await supabase
      .from("trainer_courses")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !courseData) {
      toast({
        title: "خطأ",
        description: "الدورة غير موجودة",
        variant: "destructive",
      });
      navigate("/courses");
      return;
    }

    // Get trainer name
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", courseData.trainer_id)
      .maybeSingle();

    setCourse({
      ...courseData,
      trainer_name: profileData?.full_name || "مدرب",
    });

    // Get subscriber count
    const { count } = await supabase
      .from("course_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("course_id", id);
    
    setSubscriberCount(count || 0);

    // Get ratings
    const { data: ratingsData } = await supabase
      .from("course_ratings")
      .select("rating")
      .eq("course_id", id);

    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setRatingCount(ratingsData.length);
    }

    setLoading(false);
  };

  const fetchUserData = async () => {
    // Check subscription
    const { data: subData } = await supabase
      .from("course_subscriptions")
      .select("id")
      .eq("course_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    
    setIsSubscribed(!!subData);

    // Get user rating
    const { data: ratingData } = await supabase
      .from("course_ratings")
      .select("rating")
      .eq("course_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    
    setUserRating(ratingData?.rating || 0);
  };

  const fetchComments = async () => {
    const { data: commentsData } = await supabase
      .from("course_comments")
      .select("*")
      .eq("course_id", id)
      .order("created_at", { ascending: false });

    if (commentsData) {
      const authorIds = [...new Set(commentsData.map(c => c.author_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", authorIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p.full_name]) || []
      );

      setComments(commentsData.map(c => ({
        ...c,
        author_name: profilesMap.get(c.author_id) || "مستخدم",
      })));
    }
  };

  const incrementViews = async () => {
    // Simple view increment - could be enhanced with actual RPC function
    // For now we just track via subscriptions and ratings
  };

  const handleSubscribe = async () => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول للاشتراك",
        variant: "destructive",
      });
      return;
    }

    setSubscribing(true);

    if (isSubscribed) {
      const { error } = await supabase
        .from("course_subscriptions")
        .delete()
        .eq("course_id", id)
        .eq("user_id", userId);

      if (!error) {
        setIsSubscribed(false);
        setSubscriberCount(prev => Math.max(0, prev - 1));
        toast({ title: "تم إلغاء الاشتراك" });
      }
    } else {
      const { error } = await supabase
        .from("course_subscriptions")
        .insert({ course_id: id, user_id: userId });

      if (!error) {
        setIsSubscribed(true);
        setSubscriberCount(prev => prev + 1);
        toast({ title: "تم الاشتراك بنجاح" });
      }
    }

    setSubscribing(false);
  };

  const handleRate = async (rating: number) => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول للتقييم",
        variant: "destructive",
      });
      return;
    }

    setRatingLoading(true);

    if (userRating > 0) {
      // Update existing rating
      await supabase
        .from("course_ratings")
        .update({ rating })
        .eq("course_id", id)
        .eq("user_id", userId);
    } else {
      // Insert new rating
      await supabase
        .from("course_ratings")
        .insert({ course_id: id, user_id: userId, rating });
      setRatingCount(prev => prev + 1);
    }

    setUserRating(rating);
    
    // Recalculate average
    const { data: ratingsData } = await supabase
      .from("course_ratings")
      .select("rating")
      .eq("course_id", id);

    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
      setAvgRating(Math.round(avg * 10) / 10);
    }

    setRatingLoading(false);
    toast({ title: "تم حفظ تقييمك" });
  };

  const handleSubmitComment = async () => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول للتعليق",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);

    const { error } = await supabase
      .from("course_comments")
      .insert({
        course_id: id,
        author_id: userId,
        body: newComment.trim(),
      });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل إضافة التعليق",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
      toast({ title: "تمت إضافة التعليق" });
    }

    setSubmittingComment(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!course) return null;

  const TypeIcon = typeIcons[course.type];

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/courses")}
          className="gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للدورات
        </Button>

        {/* Course Header */}
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <TypeIcon className="h-10 w-10 text-primary" />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {course.title}
            </h1>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">{categoryLabels[course.category]}</Badge>
              <Badge variant="outline">{depthLabels[course.depth_level]}</Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{subscriberCount} مشترك</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{avgRating} ({ratingCount} تقييم)</span>
            </div>
          </div>

          {course.description && (
            <p className="text-muted-foreground text-center leading-relaxed">
              {course.description}
            </p>
          )}

          <Link 
            to={`/trainer/${course.trainer_id}`}
            className="text-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            المدرب: <span className="underline">{course.trainer_name}</span>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubscribe}
            disabled={subscribing}
            variant={isSubscribed ? "outline" : "default"}
            className="flex-1 gap-2"
          >
            {subscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <>
                <CheckCircle className="h-4 w-4" />
                مشترك
              </>
            ) : (
              "اشترك الآن"
            )}
          </Button>
          {course.url && (
            <Button variant="secondary" asChild className="gap-2">
              <a href={course.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                عرض المحتوى
              </a>
            </Button>
          )}
        </div>

        {/* Progress Tracker */}
        {isSubscribed && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">تتبع التقدم</h3>
              </div>
              <CourseProgressTracker courseId={id!} userId={userId} />
            </CardContent>
          </Card>
        )}

        {/* Group Chat Section */}
        <CourseGroupChat
          courseId={id!}
          userId={userId}
          isSubscribed={isSubscribed}
        />

        {/* Rating Section */}
        <Card>
          <CardContent className="py-4">
            <h3 className="font-semibold mb-3">قيّم هذه الدورة</h3>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  disabled={ratingLoading}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= userRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {userRating > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                تقييمك: {userRating} من 5
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            التعليقات ({comments.length})
          </h3>

          {/* Add Comment */}
          <div className="flex gap-2">
            <Textarea
              placeholder="أضف تعليقاً..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <Button
            onClick={handleSubmitComment}
            disabled={submittingComment || !newComment.trim()}
            className="w-full gap-2"
          >
            {submittingComment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                إرسال التعليق
              </>
            )}
          </Button>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  لا توجد تعليقات بعد
                </CardContent>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="py-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.body}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CourseDetail;
