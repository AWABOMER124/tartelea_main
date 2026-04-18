import { useEffect, useMemo, useState } from "react";
import { Loader2, Pin, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createAdminCommunityPin,
  deleteAdminCommunityPin,
  listAdminCommunityContexts,
  listAdminCommunityPins,
  listAdminCommunityPosts,
  type AdminCommunityPin,
  type AdminCommunityPost,
} from "@/lib/backendCommunityAdmin";
import type { BackendCommunityContext } from "@/lib/backendCommunity";

const CommunityPinsManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contexts, setContexts] = useState<BackendCommunityContext[]>([]);
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [pins, setPins] = useState<AdminCommunityPin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    contextId: "",
    postId: "",
    reason: "",
    sortOrder: "0",
  });

  const loadPins = async () => {
    const response = await listAdminCommunityPins({ limit: 100, offset: 0 });
    setPins(response.items || []);
  };

  const loadContexts = async () => {
    const contextsResponse = await listAdminCommunityContexts();
    setContexts(contextsResponse);
    return contextsResponse;
  };

  const loadPosts = async (contextId?: string) => {
    const postsResponse = await listAdminCommunityPosts({
      status: "published",
      contextId: contextId || undefined,
      limit: 100,
      offset: 0,
    });
    setPosts(postsResponse.items || []);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const contextsResult = await loadContexts();
      const initialContextId = form.contextId || contextsResult[0]?.id || "";

      if (!form.contextId && initialContextId) {
        setForm((current) => ({ ...current, contextId: initialContextId }));
      }

      await Promise.all([loadPins(), loadPosts(initialContextId)]);
    } catch (error) {
      toast({
        title: "تعذر تحميل تثبيت المجتمع",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!form.contextId) return;
    void loadPosts(form.contextId);
  }, [form.contextId]);

  const filteredPosts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const candidates = posts.filter((post) => !pins.some((pin) => pin.post_id === post.id && pin.context_id === form.contextId));

    if (!term) {
      return candidates;
    }

    return candidates.filter((post) =>
      `${post.title || ""} ${post.body} ${post.author?.name || ""}`.toLowerCase().includes(term),
    );
  }, [posts, pins, form.contextId, searchQuery]);

  const handleCreatePin = async () => {
    if (!form.contextId || !form.postId) {
      toast({
        title: "أكمل البيانات",
        description: "اختر السياق والمنشور أولًا.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createAdminCommunityPin({
        context_id: form.contextId,
        post_id: form.postId,
        reason: form.reason.trim() || undefined,
        sort_order: Number(form.sortOrder) || 0,
      });

      toast({
        title: "تم التثبيت",
        description: "تم تثبيت المنشور داخل سياق المجتمع عبر الباك إند.",
      });

      setDialogOpen(false);
      setSearchQuery("");
      setForm((current) => ({
        ...current,
        postId: "",
        reason: "",
        sortOrder: "0",
      }));
      await loadPins();
    } catch (error) {
      toast({
        title: "تعذر تثبيت المنشور",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    try {
      await deleteAdminCommunityPin(pinId);
      toast({
        title: "تمت إزالة التثبيت",
      });
      await loadPins();
    } catch (error) {
      toast({
        title: "تعذر إزالة التثبيت",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Pin className="h-4 w-4" />
            تثبيت منشورات المجتمع ({pins.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            هذه الواجهة تدير `community_pins` الرسمية، وليست `pinned_content` القديمة.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              تثبيت منشور
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تثبيت منشور مجتمع</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>السياق</Label>
                <Select
                  value={form.contextId}
                  onValueChange={(value) => setForm((current) => ({ ...current, contextId: value, postId: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السياق" />
                  </SelectTrigger>
                  <SelectContent>
                    {contexts.map((context) => (
                      <SelectItem key={context.id} value={context.id}>
                        {context.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ابحث عن منشور منشور داخل هذا السياق</Label>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="ابحث بالعنوان أو النص أو اسم الكاتب"
                />
                <div className="border border-border rounded-lg max-h-52 overflow-y-auto">
                  {filteredPosts.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      لا توجد منشورات قابلة للتثبيت في هذا السياق.
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setForm((current) => ({ ...current, postId: post.id }))}
                        className={`w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors ${
                          form.postId === post.id ? "bg-primary/10 text-primary" : ""
                        }`}
                      >
                        <div className="font-medium truncate">{post.title || post.body}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {post.author?.name || "عضو المجتمع"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>سبب التثبيت</Label>
                  <Input
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="اختياري"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ترتيب العرض</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleCreatePin} disabled={submitting || !form.postId} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "تثبيت"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنشور</TableHead>
                <TableHead>السياق</TableHead>
                <TableHead>الترتيب</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pins.map((pin) => (
                <TableRow key={pin.id}>
                  <TableCell className="font-medium max-w-[220px] truncate">
                    {pin.post_title || "منشور مجتمع"}
                  </TableCell>
                  <TableCell>{pin.context_title}</TableCell>
                  <TableCell>{pin.sort_order}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{pin.reason || "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => void handleDeletePin(pin.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    لا توجد منشورات مثبتة داخل المجتمع حاليًا.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CommunityPinsManagement;
