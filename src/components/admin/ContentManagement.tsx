import { useState } from "react";
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
import {
  createAdminContent,
  deleteAdminContent,
  updateAdminContent,
  type AdminContentCategory,
  type AdminContentDepth,
  type AdminContentItem,
  type AdminContentType,
} from "@/lib/backendAdmin";

interface ContentManagementProps {
  contents: AdminContentItem[];
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
    type: "article" as AdminContentType,
    category: "quran" as AdminContentCategory,
    depth_level: "beginner" as AdminContentDepth,
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

    try {
      if (editingId) {
        await updateAdminContent(editingId, form);
        toast({ title: "تم بنجاح", description: "تم تحديث المحتوى" });
      } else {
        await createAdminContent(form);
        toast({ title: "تم بنجاح", description: "تمت إضافة المحتوى" });
      }

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشلت العملية",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (content: AdminContentItem) => {
    setEditingId(content.id);
    setForm({
      title: content.title,
      description: content.description || "",
      type: content.type,
      category: content.category,
      depth_level: content.depth_level,
      url: content.url || "",
      is_sudan_awareness: Boolean(content.is_sudan_awareness),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminContent(id);
      toast({ title: "تم بنجاح", description: "تم حذف المحتوى" });
      onRefresh();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل حذف المحتوى",
        variant: "destructive",
      });
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
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="أدخل عنوان المحتوى"
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="أدخل وصف المحتوى"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={form.type} onValueChange={(value: AdminContentType) => setForm({ ...form, type: value })}>
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
                  <Select value={form.category} onValueChange={(value: AdminContentCategory) => setForm({ ...form, category: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quran">قرآن</SelectItem>
                      <SelectItem value="values">قيم</SelectItem>
                      <SelectItem value="community">مجتمع</SelectItem>
                      <SelectItem value="sudan_awareness">الوعي السوداني</SelectItem>
                      <SelectItem value="arab_awareness">الوعي العربي</SelectItem>
                      <SelectItem value="islamic_awareness">الوعي الإسلامي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>المستوى</Label>
                <Select value={form.depth_level} onValueChange={(value: AdminContentDepth) => setForm({ ...form, depth_level: value })}>
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
                  onChange={(event) => setForm({ ...form, url: event.target.value })}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_sudan"
                  checked={form.is_sudan_awareness}
                  onChange={(event) => setForm({ ...form, is_sudan_awareness: event.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_sudan">محتوى الوعي السوداني</Label>
              </div>
              <Button onClick={() => void handleSubmit()} disabled={submitting || !form.title} className="w-full">
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
                  {content.category === "quran"
                    ? "قرآن"
                    : content.category === "values"
                      ? "قيم"
                      : content.category === "community"
                        ? "مجتمع"
                        : content.category === "sudan_awareness"
                          ? "الوعي السوداني"
                          : content.category === "arab_awareness"
                            ? "الوعي العربي"
                            : "الوعي الإسلامي"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/content/${content.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(content)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => void handleDelete(content.id)}>
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
