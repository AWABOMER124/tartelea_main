import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import CourseProgressTracker from "@/components/courses/CourseProgressTracker";
import CourseGroupChat from "@/components/courses/CourseGroupChat";
import {
  getCourseDetail,
  subscribeToCourse,
  submitCourseComment,
  submitCourseRating,
  unsubscribeFromCourse,
  type Course,
  type CourseComment,
} from "@/lib/backendCourses";
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
  beginner: "تخلية",
  intermediate: "تحلية",
  advanced: "تجلّي",
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { access, scopedCourseIds, roleOverrides } = useSubscription();

  const [course, setCourse] = useState<Course | null>(null);
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [newComment, setNewComment] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const userId = user?.id || null;
  const hasScopedCourseAccess = Boolean(id && scopedCourseIds.includes(id));
  const hasContractAccess =
    access.canAccessFullLibrary ||
    roleOverrides.admin ||
    roleOverrides.trainer ||
    hasScopedCourseAccess;
  const hasCourseAccess = isSubscribed || hasContractAccess;

  const commentCount = useMemo(() => comments.length, [comments.length]);

  useEffect(() => {
    if (!id) {
      return;
    }

    void loadCourse();
  }, [id, userId, hasContractAccess]);

  const loadCourse = async () => {
    if (!id) {
      return;
    }

    setLoading(true);

    try {
      const payload = await getCourseDetail(id, userId);

      if (!payload) {
        toast({
          title: "خطأ",
          description: "المسار غير موجود",
          variant: "destructive",
        });
        navigate("/courses");
        return;
      }

      setCourse(payload.course);
      setComments(payload.comments);
      setIsSubscribed(payload.isSubscribed);
      setUserRating(payload.userRating);
    } catch (error) {
      toast({
        title: "تعذر تحميل المسار",
        description: error instanceof Error ? error.message : "ط­ط¯ط« خطأ ط؛ظٹط± ظ…طھظˆظ‚ط¹",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!id) {
      return;
    }

    if (!userId) {
      toast({
        title: "تنبيه",
        description: "سجّل الدخول للاشتراك",
        variant: "destructive",
      });
      return;
    }

    if (hasContractAccess && !isSubscribed) {
      toast({
        title: "متاح ضمن عضويتك",
        description: "لا تحتاج إلى اشتراك مستقل للوصول إلى هذا المسار.",
      });
      return;
    }

    setSubscribing(true);

    try {
      if (isSubscribed) {
        await unsubscribeFromCourse(id, userId);
        toast({ title: "تم إلغاء الاشتراك" });
      } else {
        await subscribeToCourse(id, userId);
        toast({ title: "تم الاشتراك بنجاح" });
      }

      await loadCourse();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "ط­ط¯ط« خطأ ط؛ظٹط± ظ…طھظˆظ‚ط¹",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!id) {
      return;
    }

    if (!userId) {
      toast({
        title: "تنبيه",
        description: "سجّل الدخول للتقييم",
        variant: "destructive",
      });
      return;
    }

    setRatingLoading(true);

    try {
      await submitCourseRating(id, userId, rating, userRating > 0);
      setUserRating(rating);
      await loadCourse();
      toast({ title: "تم حفظ تقييمك" });
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "ط­ط¯ط« خطأ ط؛ظٹط± ظ…طھظˆظ‚ط¹",
        variant: "destructive",
      });
    } finally {
      setRatingLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!id) {
      return;
    }

    if (!userId) {
      toast({
        title: "تنبيه",
        description: "سجّل الدخول للتعليق",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);

    try {
      await submitCourseComment(id, userId, newComment.trim());
      setNewComment("");
      await loadCourse();
      toast({ title: "تمت إضافة التعليق" });
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشلت إضافة التعليق",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
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
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/courses")}
          className="gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط¯ظˆط±ط§طھ
        </Button>

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

          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.subscriber_count} ظ…ط´طھط±ظƒ</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{course.avg_rating} ({course.rating_count} طھظ‚ظٹظٹظ…)</span>
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
            ط§ظ„ظ…ط¯ط±ط¨: <span className="underline">{course.trainer_name}</span>
          </Link>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => void handleSubscribe()}
            disabled={subscribing}
            variant={isSubscribed || hasContractAccess ? "outline" : "default"}
            className="flex-1 gap-2"
          >
            {subscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasContractAccess && !isSubscribed ? (
              "متاح ضمن اشتراكك"
            ) : isSubscribed ? (
              <>
                <CheckCircle className="h-4 w-4" />
                ظ…ط´طھط±ظƒ
              </>
            ) : (
              "اشترك الآن"
            )}
          </Button>
          {course.url && (
            <Button variant="secondary" asChild className="gap-2">
              <a href={course.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                ط¹ط±ط¶ ط§ظ„ظ…ط­طھظˆظ‰
              </a>
            </Button>
          )}
        </div>

        {hasCourseAccess && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">طھطھط¨ط¹ ط§ظ„طھظ‚ط¯ظ…</h3>
              </div>
              <CourseProgressTracker courseId={id!} userId={userId} />
            </CardContent>
          </Card>
        )}

        <CourseGroupChat
          courseId={id!}
          userId={userId}
          isSubscribed={hasCourseAccess}
        />

        <Card>
          <CardContent className="py-4">
            <h3 className="font-semibold mb-3">ظ‚ظٹظ‘ظ… ظ‡ط°ظ‡ ط§ظ„ط¯ظˆط±ط©</h3>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => void handleRate(star)}
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
                طھظ‚ظٹظٹظ…ظƒ: {userRating} ظ…ظ† 5
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            ط§ظ„طھط¹ظ„ظٹظ‚ط§طھ ({commentCount})
          </h3>

          <div className="flex gap-2">
            <Textarea
              placeholder="أضف تعليقاً..."
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <Button
            onClick={() => void handleSubmitComment()}
            disabled={submittingComment || !newComment.trim()}
            className="w-full gap-2"
          >
            {submittingComment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                ط¥ط±ط³ط§ظ„ ط§ظ„طھط¹ظ„ظٹظ‚
              </>
            )}
          </Button>

          <div className="space-y-3">
            {comments.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  ظ„ط§ طھظˆط¬ط¯ طھط¹ظ„ظٹظ‚ط§طھ ط¨ط¹ط¯
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
