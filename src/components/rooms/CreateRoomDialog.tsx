import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Lock, Globe, ImagePlus, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ContentCategory = Database["public"]["Enums"]["content_category"];

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const categories: { value: ContentCategory; label: string }[] = [
  { value: "quran", label: "القرآن" },
  { value: "values", label: "القيم" },
  { value: "community", label: "المجتمع" },
  { value: "sudan_awareness", label: "الوعي السوداني" },
  { value: "arab_awareness", label: "الوعي العربي" },
  { value: "islamic_awareness", label: "الوعي الإسلامي" },
];

const CreateRoomDialog = ({ open, onOpenChange, onSuccess }: CreateRoomDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as ContentCategory | "",
    scheduled_at: "",
    duration_minutes: 30,
    price: 0,
    max_participants: 50,
    access_type: "public" as "public" | "subscribers_only",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "خطأ", description: "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (roomId: string): Promise<string | null> => {
    if (!imageFile) return null;
    const ext = imageFile.name.split(".").pop();
    const path = `${roomId}.${ext}`;
    const { error } = await supabase.storage.from("room-images").upload(path, imageFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("room-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.scheduled_at) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roomData, error } = await supabase.from("rooms").insert({
      title: formData.title,
      description: formData.description || null,
      category: formData.category as ContentCategory,
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      duration_minutes: formData.duration_minutes,
      price: formData.price,
      max_participants: formData.max_participants,
      host_id: user.id,
      is_approved: false,
      access_type: formData.access_type,
    }).select("id").single();

    if (error || !roomData) {
      toast({ title: "خطأ", description: "فشل إنشاء الغرفة", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Upload image if selected
    if (imageFile) {
      const imageUrl = await uploadImage(roomData.id);
      if (imageUrl) {
        await supabase.from("rooms").update({ image_url: imageUrl }).eq("id", roomData.id);
      }
    }

    toast({ title: "تم بنجاح", description: "تم إرسال الغرفة للمراجعة" });
    setFormData({
      title: "", description: "", category: "", scheduled_at: "",
      duration_minutes: 30, price: 0, max_participants: 50, access_type: "public",
    });
    removeImage();
    onOpenChange(false);
    onSuccess();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء غرفة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Image */}
          <div className="space-y-2">
            <Label>صورة الغرفة</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                <img src={imagePreview} alt="صورة الغرفة" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2 h-7 w-7"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">اضغط لإضافة صورة</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">عنوان الغرفة *</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="أدخل عنوان الغرفة" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف مختصر للغرفة" rows={3} />
          </div>

          <div className="space-y-2">
            <Label>التصنيف *</Label>
            <Select value={formData.category} onValueChange={(value: ContentCategory) => setFormData({ ...formData, category: value })}>
              <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_at">موعد الغرفة *</Label>
            <Input id="scheduled_at" type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">المدة (دقيقة)</Label>
              <Input id="duration" type="number" min={15} max={120} value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">الحد الأقصى</Label>
              <Input id="max_participants" type="number" min={5} max={200} value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 50 })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">السعر ($)</Label>
            <Input id="price" type="number" min={0} step={0.01} value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
            <p className="text-xs text-muted-foreground">اترك 0 لجعل الغرفة مجانية</p>
          </div>

          <div className="space-y-2">
            <Label>نوع الوصول *</Label>
            <Select value={formData.access_type} onValueChange={(value: "public" | "subscribers_only") => setFormData({ ...formData, access_type: value })}>
              <SelectTrigger><SelectValue placeholder="اختر نوع الوصول" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <span className="flex items-center gap-2"><Globe className="h-4 w-4" />عامة - للجميع</span>
                </SelectItem>
                <SelectItem value="subscribers_only">
                  <span className="flex items-center gap-2"><Lock className="h-4 w-4" />للمشتركين فقط</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.access_type === "subscribers_only" ? "الغرفة متاحة فقط لأصحاب الاشتراك الشهري" : "الغرفة متاحة لجميع المستخدمين"}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال للمراجعة"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
