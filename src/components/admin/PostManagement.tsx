import { useEffect, useState } from "react";
import { Loader2, Lock, LockOpen, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  applyAdminCommunityModerationAction,
  type AdminCommunityPost,
  type AdminCommunityReport,
  listAdminCommunityPosts,
  listAdminCommunityReports,
} from "@/lib/backendCommunityAdmin";

type StatusFilter = "all" | "published" | "hidden" | "deleted" | "archived";

const statusLabels: Record<Exclude<StatusFilter, "all">, string> = {
  published: "منشور",
  hidden: "مخفي",
  deleted: "محذوف",
  archived: "مؤرشف",
};

const reasonLabels: Record<string, string> = {
  spam: "سبام",
  abuse: "إساءة",
  off_topic: "خارج الموضوع",
  misinformation: "معلومات مضللة",
  copyright: "حقوق نشر",
  other: "سبب آخر",
};

const PostManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [total, setTotal] = useState(0);
  const [reports, setReports] = useState<AdminCommunityReport[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsResponse, reportsResponse] = await Promise.all([
        listAdminCommunityPosts({
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 50,
          offset: 0,
        }),
        listAdminCommunityReports({
          status: "pending",
          targetType: "post",
          limit: 10,
          offset: 0,
        }),
      ]);

      setPosts(postsResponse.items || []);
      setTotal(postsResponse.total || 0);
      setReports(reportsResponse.reports || []);
    } catch (error) {
      toast({
        title: "تعذر تحميل إدارة المجتمع",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [statusFilter]);

  const handleAction = async (
    post: AdminCommunityPost,
    actionType: "hide" | "unhide" | "delete" | "restore" | "lock" | "unlock",
  ) => {
    try {
      setActioningId(`${actionType}:${post.id}`);
      await applyAdminCommunityModerationAction({
        action_type: actionType,
        target_type: "post",
        target_id: post.id,
      });

      toast({
        title: "تم تحديث المنشور",
        description: "تم تنفيذ إجراء الإدارة بنجاح عبر Community Admin API.",
      });
      await loadData();
    } catch (error) {
      toast({
        title: "تعذر تنفيذ الإجراء",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
    }
  };

  const renderModerationActions = (post: AdminCommunityPost) => {
    const actionBusy = (action: string) => actioningId === `${action}:${post.id}`;

    if (post.status === "deleted") {
      return (
        <Button variant="ghost" size="sm" onClick={() => void handleAction(post, "restore")} disabled={!!actioningId}>
          {actionBusy("restore") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleAction(post, post.status === "hidden" ? "unhide" : "hide")}
          disabled={!!actioningId}
        >
          {actionBusy(post.status === "hidden" ? "unhide" : "hide") ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleAction(post, post.is_locked ? "unlock" : "lock")}
          disabled={!!actioningId || post.status === "deleted"}
        >
          {actionBusy(post.is_locked ? "unlock" : "lock") ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : post.is_locked ? (
            <LockOpen className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleAction(post, "delete")}
          disabled={!!actioningId}
        >
          {actionBusy("delete") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-foreground">إدارة منشورات المجتمع ({total})</h2>
          <p className="text-sm text-muted-foreground">
            هذه الواجهة تعمل الآن عبر Community Admin API في الباك إند، وليس عبر جداول Supabase القديمة.
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="published">المنشورة</SelectItem>
              <SelectItem value="hidden">المخفية</SelectItem>
              <SelectItem value="deleted">المحذوفة</SelectItem>
              <SelectItem value="archived">المؤرشفة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنشور</TableHead>
                <TableHead>السياق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>البلاغات</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-[260px]">
                    <div className="space-y-1">
                      <div className="font-medium truncate">{post.title || post.body}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{post.body}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.kind === "announcement" && <Badge variant="outline">إعلان</Badge>}
                        {post.pin?.id && <Badge variant="secondary">مثبت</Badge>}
                        {post.is_locked && <Badge variant="outline">مقفل</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{post.primary_context?.title || "المجتمع"}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "secondary" : "outline"}>
                      {statusLabels[post.status as Exclude<StatusFilter, "all">] || post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.pending_reports_count || 0}</TableCell>
                  <TableCell>{new Date(post.created_at).toLocaleDateString("ar")}</TableCell>
                  <TableCell>{renderModerationActions(post)}</TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد منشورات مجتمع مطابقة لهذا الفلتر.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground">أحدث البلاغات على منشورات المجتمع</h3>
          <Badge variant="outline">{reports.length}</Badge>
        </div>
        <div className="space-y-2">
          {reports.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              لا توجد بلاغات منشورات معلقة حاليًا.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-xl border bg-card p-4 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{reasonLabels[report.reason_code] || report.reason_code}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {report.reporter_name || "عضو المجتمع"} • {new Date(report.created_at).toLocaleDateString("ar")}
                  </span>
                </div>
                <div className="text-sm text-foreground line-clamp-2">{report.target_preview || "بدون معاينة"}</div>
                {report.note && (
                  <div className="text-xs text-muted-foreground">ملاحظة المبلغ: {report.note}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostManagement;
