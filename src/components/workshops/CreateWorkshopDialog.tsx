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
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ContentCategory = Database["public"]["Enums"]["content_category"];

interface CreateWorkshopDialogProps {
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

const CreateWorkshopDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkshopDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as ContentCategory | "",
    scheduled_at: "",
    duration_minutes: 60,
    price: 0,
    max_participants: 100,
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (userId: string, workshopId: string): Promise<string | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    const fileExt = imageFile.name.split(".").pop();
    const filePath = `${userId}/${workshopId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("workshop-images")
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setUploadingImage(false);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("workshop-images")
      .getPublicUrl(filePath);

    setUploadingImage(false);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.scheduled_at) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // First create the workshop
    const { data: workshopData, error } = await supabase
      .from("workshops")
      .insert({
        title: formData.title,
        description: formData.description || null,
        category: formData.category as ContentCategory,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        max_participants: formData.max_participants,
        host_id: user.id,
        is_approved: false,
      })
      .select("id")
      .single();

    if (error || !workshopData) {
      toast({
        title: "خطأ",
        description: "فشل إنشاء الورشة",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Upload image if exists
    if (imageFile) {
      const imageUrl = await uploadImage(user.id, workshopData.id);
      if (imageUrl) {
        await supabase
          .from("workshops")
          .update({ image_url: imageUrl })
          .eq("id", workshopData.id);
      }
    }

    toast({
      title: "تم بنجاح",
      description: "تم إرسال الورشة للمراجعة",
    });
    
    setFormData({
      title: "",
      description: "",
      category: "",
      scheduled_at: "",
      duration_minutes: 60,
      price: 0,
      max_participants: 100,
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
          <DialogTitle>إنشاء ورشة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الورشة *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="أدخل عنوان الورشة"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="وصف مختصر للورشة"
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>صورة الورشة</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="معاينة"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 left-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm">اضغط لرفع صورة</span>
              </button>
            )}
            <p className="text-xs text-muted-foreground">
              الحد الأقصى 5 ميجابايت
            </p>
          </div>

          <div className="space-y-2">
            <Label>التصنيف *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: ContentCategory) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_at">موعد الورشة *</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_at: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">المدة (دقيقة)</Label>
              <Input
                id="duration"
                type="number"
                min={15}
                max={240}
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value) || 60,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">الحد الأقصى</Label>
              <Input
                id="max_participants"
                type="number"
                min={5}
                max={500}
                value={formData.max_participants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_participants: parseInt(e.target.value) || 100,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">السعر ($)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step={0.01}
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              اترك 0 لجعل الورشة مجانية
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "إرسال للمراجعة"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkshopDialog;
