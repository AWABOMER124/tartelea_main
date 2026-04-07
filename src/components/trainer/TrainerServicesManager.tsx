import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Loader2,
  UserCheck,
  MessageSquare,
  GraduationCap,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface TrainerService {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  service_type: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

const serviceTypeLabels: Record<string, { label: string; icon: typeof UserCheck }> = {
  private_session: { label: "جلسة خاصة", icon: UserCheck },
  consultation: { label: "استشارة", icon: MessageSquare },
  mentorship: { label: "توجيه ومتابعة", icon: GraduationCap },
  review: { label: "مراجعة محتوى", icon: FileCheck },
  custom: { label: "خدمة مخصصة", icon: Sparkles },
};

interface TrainerServicesManagerProps {
  trainerId: string;
}

const TrainerServicesManager = ({ trainerId }: TrainerServicesManagerProps) => {
  const { toast } = useToast();
  const [services, setServices] = useState<TrainerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<TrainerService | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    service_type: "private_session",
    duration_minutes: 60,
    price: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, [trainerId]);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trainer_services")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      service_type: "private_session",
      duration_minutes: 60,
      price: 0,
      is_active: true,
    });
    setEditingService(null);
  };

  const openEditDialog = (service: TrainerService) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || "",
      service_type: service.service_type,
      duration_minutes: service.duration_minutes,
      price: service.price,
      is_active: service.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الخدمة",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    if (editingService) {
      const { error } = await supabase
        .from("trainer_services")
        .update({
          title: formData.title,
          description: formData.description || null,
          service_type: formData.service_type,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingService.id);

      if (error) {
        toast({ title: "خطأ", description: "فشل تحديث الخدمة", variant: "destructive" });
      } else {
        toast({ title: "تم بنجاح", description: "تم تحديث الخدمة" });
        fetchServices();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("trainer_services")
        .insert({
          trainer_id: trainerId,
          title: formData.title,
          description: formData.description || null,
          service_type: formData.service_type,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          is_active: formData.is_active,
        });

      if (error) {
        toast({ title: "خطأ", description: "فشل إضافة الخدمة", variant: "destructive" });
      } else {
        toast({ title: "تم بنجاح", description: "تمت إضافة الخدمة" });
        fetchServices();
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (serviceId: string) => {
    const { error } = await supabase
      .from("trainer_services")
      .delete()
      .eq("id", serviceId);

    if (error) {
      toast({ title: "خطأ", description: "فشل حذف الخدمة", variant: "destructive" });
    } else {
      toast({ title: "تم بنجاح", description: "تم حذف الخدمة" });
      fetchServices();
    }
  };

  const toggleActive = async (service: TrainerService) => {
    const { error } = await supabase
      .from("trainer_services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);

    if (!error) {
      fetchServices();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">خدماتي الخاصة</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة خدمة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>عنوان الخدمة *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: جلسة تدبر خاصة"
                />
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للخدمة"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>نوع الخدمة</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceTypeLabels).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المدة (بالدقائق)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                    min={15}
                    step={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>السعر ($)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={5}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>الخدمة نشطة</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingService ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">لم تضف أي خدمات بعد</p>
          <p className="text-sm text-muted-foreground mt-1">
            أضف خدمات مثل الجلسات الخاصة والاستشارات
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {services.map((service) => {
            const typeInfo = serviceTypeLabels[service.service_type] || serviceTypeLabels.custom;
            const TypeIcon = typeInfo.icon;
            return (
              <Card key={service.id} className={!service.is_active ? "opacity-60" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{service.title}</h4>
                        {!service.is_active && (
                          <Badge variant="secondary" className="text-xs">معطلة</Badge>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} دقيقة
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {service.price === 0 ? "مجاني" : `$${service.price}`}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(service)}
                      >
                        <Switch checked={service.is_active} className="scale-75" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainerServicesManager;
