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
  quran: "ط§ظ„ظ‚ط±ط¢ظ†",
  values: "ط§ظ„ظ‚ظٹظ…",
  community: "ط§ظ„ظ…ط¬طھظ…ط¹",
  sudan_awareness: "ط§ظ„ظˆط¹ظٹ ط§ظ„ط³ظˆط¯ط§ظ†ظٹ",
  arab_awareness: "ط§ظ„ظˆط¹ظٹ ط§ظ„ط¹ط±ط¨ظٹ",
  islamic_awareness: "ط§ظ„ظˆط¹ظٹ ط§ظ„ط¥ط³ظ„ط§ظ…ظٹ",
};

const depthLabels: Record<string, string> = {
  beginner: "ظ…ط¨طھط¯ط¦",
  intermediate: "ظ…طھظˆط³ط·",
  advanced: "ظ…طھظ‚ط¯ظ…",
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
          title: "ط®ط·ط£",
          description: "ط§ظ„ط¯ظˆط±ط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©",
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
        title: "طªط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ط¯ظˆط±ط©",
        description: error instanceof Error ? error.message : "ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹",
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
        title: "طھظ†ط¨ظٹظ‡",
        description: "ظٹط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„ط§ط´طھط±ط§ظƒ",
        variant: "destructive",
      });
      return;
    }

    if (hasContractAccess && !isSubscribed) {
      toast({
        title: "ظ…طھط§ط­ ط¶ظ…ظ† ط§ط´طھط±ط§ظƒظƒ",
        description: "ظ„ط§ طھط­طھط§ط¬ ط¥ظ„ظ‰ ط§ط´طھط±ط§ظƒ ط¯ظˆط±ط© ظ…ط³طھظ‚ظ„ ظ„ظ„ظˆطµظˆظ„.",
      });
      return;
    }

    setSubscribing(true);

    try {
      if (isSubscribed) {
        await unsubscribeFromCourse(id, userId);
        toast({ title: "طھظ… ط¥ظ„ط؛ط§ط، ط§ظ„ط§ط´طھط±ط§ظƒ" });
      } else {
        await subscribeToCourse(id, userId);
        toast({ title: "طھظ… ط§ظ„ط§ط´طھط±ط§ظƒ ط¨ظ†ط¬ط§ط­" });
      }

      await loadCourse();
    } catch (error) {
      toast({
        title: "ط®ط·ط£",
        description: error instanceof Error ? error.message : "ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹",
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
        title: "طھظ†ط¨ظٹظ‡",
        description: "ظٹط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„طھظ‚ظٹظٹظ…",
        variant: "destructive",
      });
      return;
    }

    setRatingLoading(true);

    try {
      await submitCourseRating(id, userId, rating, userRating > 0);
      setUserRating(rating);
      await loadCourse();
      toast({ title: "طھظ… ط­ظپط¸ طھظ‚ظٹظٹظ…ظƒ" });
    } catch (error) {
      toast({
        title: "ط®ط·ط£",
        description: error instanceof Error ? error.message : "ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹",
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
        title: "طھظ†ط¨ظٹظ‡",
        description: "ظٹط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„طھط¹ظ„ظٹظ‚",
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
      toast({ title: "طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„طھط¹ظ„ظٹظ‚" });
    } catch (error) {
      toast({
        title: "ط®ط·ط£",
        description: error instanceof Error ? error.message : "ظپط´ظ„ ط¥ط¶ط§ظپط© ط§ظ„طھط¹ظ„ظٹظ‚",
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
      <div className="px-4 py-6 space-y-6">
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
              "ط§ط´طھط±ظƒ ط§ظ„ط¢ظ†"
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
              placeholder="ط£ط¶ظپ طھط¹ظ„ظٹظ‚ط§ظ‹..."
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
