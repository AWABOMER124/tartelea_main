import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Video, Headphones, Calendar } from "lucide-react";
import { format, ar } from "@/lib/date-utils";
import {
  listAdminRooms,
  listAdminWorkshops,
  updateAdminRoomApproval,
  updateAdminWorkshopApproval,
  type AdminRoom,
  type AdminWorkshop,
} from "@/lib/backendAdmin";

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const EventsManagement = () => {
  const { toast } = useToast();
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const [workshopItems, roomItems] = await Promise.all([
        listAdminWorkshops(),
        listAdminRooms(),
      ]);
      setWorkshops(workshopItems);
      setRooms(roomItems);
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل تحميل الفعاليات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWorkshop = async (id: string, approve: boolean) => {
    setProcessingId(`workshop:${id}`);

    try {
      await updateAdminWorkshopApproval(id, approve);
      toast({
        title: "تم",
        description: approve ? "تمت الموافقة على الورشة" : "تم إلغاء اعتماد الورشة",
      });
      await fetchEvents();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل تحديث حالة الورشة",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveRoom = async (id: string, approve: boolean) => {
    setProcessingId(`room:${id}`);

    try {
      await updateAdminRoomApproval(id, approve);
      toast({
        title: "تم",
        description: approve ? "تمت الموافقة على الغرفة" : "تم إلغاء اعتماد الغرفة",
      });
      await fetchEvents();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل تحديث حالة الغرفة",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingWorkshops = workshops.filter((workshop) => !workshop.is_approved);
  const pendingRooms = rooms.filter((room) => !room.is_approved);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Video className="h-5 w-5" />
          ورش بانتظار الموافقة ({pendingWorkshops.length})
        </h3>
        {pendingWorkshops.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              لا توجد ورش بانتظار الموافقة
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingWorkshops.map((workshop) => (
              <Card key={workshop.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {workshop.title}
                      </h4>
                      {workshop.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {workshop.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">
                          {categoryLabels[workshop.category]}
                        </Badge>
                        <Badge variant="outline">
                          {workshop.price > 0 ? `$${workshop.price}` : "مجاني"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(workshop.scheduled_at), "dd MMM yyyy HH:mm", { locale: ar })}
                        </span>
                        <span>المدرب: {workshop.trainer_name}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => void handleApproveWorkshop(workshop.id, false)}
                        disabled={processingId === `workshop:${workshop.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleApproveWorkshop(workshop.id, true)}
                        disabled={processingId === `workshop:${workshop.id}`}
                      >
                        {processingId === `workshop:${workshop.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          غرف بانتظار الموافقة ({pendingRooms.length})
        </h3>
        {pendingRooms.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              لا توجد غرف بانتظار الموافقة
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRooms.map((room) => (
              <Card key={room.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {room.title}
                      </h4>
                      {room.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {room.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">
                          {categoryLabels[room.category]}
                        </Badge>
                        <Badge variant="outline">
                          {room.price > 0 ? `$${room.price}` : "مجاني"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(room.scheduled_at), "dd MMM yyyy HH:mm", { locale: ar })}
                        </span>
                        <span>المضيف: {room.host_name}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => void handleApproveRoom(room.id, false)}
                        disabled={processingId === `room:${room.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleApproveRoom(room.id, true)}
                        disabled={processingId === `room:${room.id}`}
                      >
                        {processingId === `room:${room.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">
          جميع الفعاليات
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Video className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {workshops.length}
              </p>
              <p className="text-sm text-muted-foreground">ورشة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Headphones className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {rooms.length}
              </p>
              <p className="text-sm text-muted-foreground">غرفة</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventsManagement;
