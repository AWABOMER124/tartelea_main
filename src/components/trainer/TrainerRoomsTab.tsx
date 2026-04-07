import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Headphones, Clock, CheckCircle, Calendar } from "lucide-react";
import CreateRoomDialog from "@/components/rooms/CreateRoomDialog";
import type { Database } from "@/integrations/supabase/types";

type ContentCategory = Database["public"]["Enums"]["content_category"];

interface Room {
  id: string;
  title: string;
  description: string | null;
  category: ContentCategory;
  scheduled_at: string;
  duration_minutes: number | null;
  is_approved: boolean | null;
  is_live: boolean | null;
  price: number | null;
  max_participants: number | null;
  access_type: string;
}

const categoryLabels: Record<string, string> = {
  quran: "القرآن", values: "القيم", community: "المجتمع",
  sudan_awareness: "الوعي السوداني", arab_awareness: "الوعي العربي", islamic_awareness: "الوعي الإسلامي",
};

interface Props {
  rooms: Room[];
  onRefresh: () => void;
}

const TrainerRoomsTab = ({ rooms, onRefresh }: Props) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "فشل حذف الغرفة", variant: "destructive" });
    } else {
      toast({ title: "تم بنجاح", description: "تم حذف الغرفة" });
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">غرفي الصوتية</h2>
        <Button className="gap-2" size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          إنشاء غرفة
        </Button>
      </div>

      <CreateRoomDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={onRefresh} />

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Headphones className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لم تنشئ أي غرف صوتية بعد</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              أنشئ غرفتك الأولى
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rooms.map((r) => {
            const isPast = new Date(r.scheduled_at) < new Date();
            return (
              <Card key={r.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Headphones className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground line-clamp-1">{r.title}</p>
                          {r.description && <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{r.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(r.scheduled_at).toLocaleDateString("ar", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{categoryLabels[r.category]}</Badge>
                        {r.is_live && <Badge className="bg-destructive text-xs animate-pulse">مباشر</Badge>}
                        {r.is_approved ? (
                          <Badge className="bg-primary/10 text-primary text-xs gap-1"><CheckCircle className="h-3 w-3" />معتمدة</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1"><Clock className="h-3 w-3" />قيد المراجعة</Badge>
                        )}
                        {isPast && !r.is_live && <Badge variant="outline" className="text-xs">منتهية</Badge>}
                        <Badge variant="outline" className="text-xs">{r.access_type === "subscribers_only" ? "للمشتركين" : "عامة"}</Badge>
                        {r.price && r.price > 0 ? <Badge variant="outline" className="text-xs">${r.price}</Badge> : <Badge variant="outline" className="text-xs">مجانية</Badge>}
                      </div>
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

export default TrainerRoomsTab;
