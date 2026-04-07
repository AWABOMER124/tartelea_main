import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Trash2, Pin, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface PinnedItem {
  id: string;
  content_type: string;
  content_id: string;
  ticker_position: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  content_title?: string;
}

const PinnedContentManagement = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<PinnedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string; title: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    content_type: "post" as "post" | "course" | "workshop",
    content_id: "",
    ticker_position: "trending" as "trending" | "latest",
    display_order: 0,
  });

  const fetchPinned = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pinned_content")
      .select("*")
      .order("ticker_position")
      .order("display_order");

    if (data) {
      // Resolve titles
      const enriched: PinnedItem[] = [];
      for (const item of data) {
        let title = "";
        if (item.content_type === "post") {
          const { data: p } = await supabase.from("posts").select("title").eq("id", item.content_id).single();
          title = p?.title || "منشور محذوف";
        } else if (item.content_type === "course") {
          const { data: c } = await supabase.from("trainer_courses").select("title").eq("id", item.content_id).single();
          title = c?.title || "دورة محذوفة";
        } else {
          const { data: w } = await supabase.from("workshops").select("title").eq("id", item.content_id).single();
          title = w?.title || "ورشة محذوفة";
        }
        enriched.push({ ...item, content_title: title });
      }
      setItems(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPinned();
  }, []);

  const searchContent = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const table = form.content_type === "post" ? "posts" : form.content_type === "course" ? "trainer_courses" : "workshops";
    const { data } = await supabase
      .from(table)
      .select("id, title")
      .ilike("title", `%${query}%`)
      .limit(5);

    setSearchResults(data || []);
  };

  const handleAdd = async () => {
    if (!form.content_id) {
      toast({ title: "خطأ", description: "اختر المحتوى", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("pinned_content").insert({
      content_type: form.content_type,
      content_id: form.content_id,
      ticker_position: form.ticker_position,
      display_order: form.display_order,
      pinned_by: user.id,
    });

    if (error) {
      toast({ title: "خطأ", description: "فشل تثبيت المحتوى", variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم تثبيت المحتوى بنجاح" });
      setDialogOpen(false);
      setForm({ content_type: "post", content_id: "", ticker_position: "trending", display_order: 0 });
      setSearchQuery("");
      setSearchResults([]);
      fetchPinned();
    }
    setSubmitting(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("pinned_content").update({ is_active: !current }).eq("id", id);
    fetchPinned();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("pinned_content").delete().eq("id", id);
    toast({ title: "تم", description: "تم إزالة التثبيت" });
    fetchPinned();
  };

  const typeLabels: Record<string, string> = { post: "منشور", course: "دورة", workshop: "ورشة" };
  const posLabels: Record<string, string> = { trending: "المواضيع الرائجة", latest: "جديد المنصة" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Pin className="h-4 w-4" />
          المحتوى المثبت ({items.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              تثبيت محتوى
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تثبيت محتوى في الصفحة الرئيسية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>نوع المحتوى</Label>
                  <Select
                    value={form.content_type}
                    onValueChange={(v: "post" | "course" | "workshop") => {
                      setForm({ ...form, content_type: v, content_id: "" });
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">منشور</SelectItem>
                      <SelectItem value="course">دورة</SelectItem>
                      <SelectItem value="workshop">ورشة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الموضع</Label>
                  <Select
                    value={form.ticker_position}
                    onValueChange={(v: "trending" | "latest") => setForm({ ...form, ticker_position: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trending">المواضيع الرائجة</SelectItem>
                      <SelectItem value="latest">جديد المنصة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>البحث عن المحتوى</Label>
                <Input
                  value={searchQuery}
                  onChange={(e) => searchContent(e.target.value)}
                  placeholder="اكتب للبحث..."
                />
                {searchResults.length > 0 && (
                  <div className="border border-border rounded-lg max-h-32 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setForm({ ...form, content_id: r.id });
                          setSearchQuery(r.title);
                          setSearchResults([]);
                        }}
                        className={`w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors ${
                          form.content_id === r.id ? "bg-primary/10 text-primary" : ""
                        }`}
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>ترتيب العرض</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <Button onClick={handleAdd} disabled={submitting || !form.content_id} className="w-full">
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
                <TableHead>المحتوى</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الموضع</TableHead>
                <TableHead>الترتيب</TableHead>
                <TableHead>فعّال</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    {item.content_title}
                  </TableCell>
                  <TableCell>{typeLabels[item.content_type]}</TableCell>
                  <TableCell className="text-xs">{posLabels[item.ticker_position]}</TableCell>
                  <TableCell>{item.display_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => toggleActive(item.id, item.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا يوجد محتوى مثبت
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

export default PinnedContentManagement;
