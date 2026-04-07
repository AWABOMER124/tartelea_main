import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, Edit, Loader2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["contents"]["Row"];
type ContentCategory = Database["public"]["Enums"]["content_category"];
type ContentType = Database["public"]["Enums"]["content_type"];
type DepthLevel = Database["public"]["Enums"]["depth_level"];

interface ContentManagementProps {
  contents: Content[];
  onRefresh: () => void;
}

const ContentManagement = ({ contents, onRefresh }: ContentManagementProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "article" as ContentType,
    category: "quran" as ContentCategory,
    depth_level: "beginner" as DepthLevel,
    url: "",
    is_sudan_awareness: false,
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      type: "article",
      category: "quran",
      depth_level: "beginner",
      url: "",
      is_sudan_awareness: false,
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال العنوان", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    if (editingId) {
      const { error } = await supabase.from("contents").update(form).eq("id", editingId);
      if (error) {
        toast({ title: "خطأ", description: "فشل تحديث المحتوى", variant: "destructive" });
      } else {
        toast({ title: "تم بنجاح", description: "تم تحديث المحتوى" });
        setDialogOpen(false);
        resetForm();
        onRefresh();
      }
    } else {
      const { error } = await supabase.from("contents").insert(form);
      if (error) {
        toast({ title: "خطأ", description: "فشل إضافة المحتوى", variant: "destructive" });
      } else {
        toast({ title: "تم بنجاح", description: "تم إضافة المحتوى" });
        setDialogOpen(false);
        resetForm();
        onRefresh();
      }
    }

    setSubmitting(false);
  };

  const handleEdit = (content: Content) => {
    setEditingId(content.id);
    setForm({
      title: content.title,
      description: content.description || "",
      type: content.type,
      category: content.category,
      depth_level: content.depth_level,
      url: content.url || "",
      is_sudan_awareness: content.is_sudan_awareness || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contents").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "فشل حذف المحتوى", variant: "destructive" });
    } else {
      toast({ title: "تم بنجاح", description: "تم حذف المحتوى" });
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground">إدارة المحتوى ({contents.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "تعديل المحتوى" : "إضافة محتوى جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="أدخل عنوان المحتوى"
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="أدخل وصف المحتوى"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={form.type} onValueChange={(value: ContentType) => setForm({ ...form, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">مقال</SelectItem>
                      <SelectItem value="audio">صوتي</SelectItem>
                      <SelectItem value="video">فيديو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={form.category} onValueChange={(value: ContentCategory) => setForm({ ...form, category: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quran">قرآن</SelectItem>
                      <SelectItem value="values">قيم</SelectItem>
                      <SelectItem value="community">مجتمع</SelectItem>
                      <SelectItem value="sudan_awareness">الوعي السوداني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>المستوى</Label>
                <Select value={form.depth_level} onValueChange={(value: DepthLevel) => setForm({ ...form, depth_level: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدئ</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الرابط (اختياري)</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_sudan"
                  checked={form.is_sudan_awareness}
                  onChange={(e) => setForm({ ...form, is_sudan_awareness: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_sudan">محتوى الوعي السوداني</Label>
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !form.title} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العنوان</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contents.map((content) => (
              <TableRow key={content.id}>
                <TableCell className="font-medium max-w-[150px] truncate">{content.title}</TableCell>
                <TableCell>
                  {content.type === "article" ? "مقال" : content.type === "audio" ? "صوتي" : "فيديو"}
                </TableCell>
                <TableCell>
                  {content.category === "quran" ? "قرآن" : content.category === "values" ? "قيم" : content.category === "community" ? "مجتمع" : "الوعي"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/content/${content.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(content)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(content.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {contents.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">لا يوجد محتوى</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContentManagement;
