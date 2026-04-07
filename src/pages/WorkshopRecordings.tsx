import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import FilterChip from "@/components/ui/FilterChip";
import { Play, Calendar, Video, ArrowRight, Search, X } from "lucide-react";
import { format, ar } from "@/lib/date-utils";

interface Recording {
  id: string;
  recording_url: string | null;
  duration_seconds: number | null;
  recorded_at: string | null;
  cloudflare_uid: string | null;
  workshop: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    host_name: string | null;
  };
}

const categoryFilters = [
  { value: "all", label: "الكل" },
  { value: "quran", label: "القرآن" },
  { value: "values", label: "القيم" },
  { value: "community", label: "المجتمع" },
  { value: "sudan_awareness", label: "الوعي السوداني" },
  { value: "arab_awareness", label: "الوعي العربي" },
  { value: "islamic_awareness", label: "الوعي الإسلامي" },
];

const WorkshopRecordings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const { data: recordingsData, error: recordingsError } = await supabase
        .from("workshop_recordings")
        .select(`
          id,
          recording_url,
          duration_seconds,
          recorded_at,
          cloudflare_uid,
          workshop_id
        `)
        .eq("is_available", true)
        .order("recorded_at", { ascending: false });

      if (recordingsError) throw recordingsError;

      if (recordingsData && recordingsData.length > 0) {
        const workshopIds = recordingsData.map((r) => r.workshop_id);
        const { data: workshopsData } = await supabase
          .from("workshops")
          .select("id, title, description, category, host_id")
          .in("id", workshopIds);

        const hostIds = workshopsData?.map((w) => w.host_id) || [];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", hostIds);

        const profilesMap = new Map(profilesData?.map((p) => [p.id, p.full_name]) || []);
        const workshopsMap = new Map(
          workshopsData?.map((w) => [
            w.id,
            {
              id: w.id,
              title: w.title,
              description: w.description,
              category: w.category,
              host_name: profilesMap.get(w.host_id) || "مدرب",
            },
          ]) || []
        );

        const formattedRecordings: Recording[] = recordingsData.map((r) => ({
          id: r.id,
          recording_url: r.recording_url,
          duration_seconds: r.duration_seconds,
          recorded_at: r.recorded_at,
          cloudflare_uid: r.cloudflare_uid,
          workshop: workshopsMap.get(r.workshop_id) || {
            id: r.workshop_id,
            title: "ورشة عمل",
            description: null,
            category: "quran",
            host_name: "مدرب",
          },
        }));

        setRecordings(formattedRecordings);
      }
    } catch (error) {
      console.error("Error fetching recordings:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل التسجيلات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecordings = useMemo(() => {
    return recordings.filter((recording) => {
      // Category filter
      if (selectedCategory !== "all" && recording.workshop.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = recording.workshop.title.toLowerCase().includes(query);
        const matchesTrainer = recording.workshop.host_name?.toLowerCase().includes(query);
        const matchesDescription = recording.workshop.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTrainer && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [recordings, selectedCategory, searchQuery]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCategoryLabel = (category: string) => {
    const filter = categoryFilters.find((f) => f.value === category);
    return filter?.label || category;
  };

  const handlePlayRecording = (recording: Recording) => {
    if (recording.recording_url) {
      navigate(`/workshop-recording/${recording.id}`, {
        state: { recording },
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <AppLayout>
      <div className="p-4 pb-24 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">تسجيلات الورش</h1>
            <p className="text-muted-foreground text-sm">
              شاهد تسجيلات الورش السابقة
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالعنوان أو اسم المدرب..."
            className="pr-10 pl-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categoryFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              isActive={selectedCategory === filter.value}
              onClick={() => setSelectedCategory(filter.value)}
            />
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-muted-foreground">
            {filteredRecordings.length} تسجيل
            {searchQuery && ` لـ "${searchQuery}"`}
            {selectedCategory !== "all" && ` في ${getCategoryLabel(selectedCategory)}`}
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-40 w-full mb-4 rounded-lg" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRecordings.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || selectedCategory !== "all"
                  ? "لا توجد نتائج"
                  : "لا توجد تسجيلات متاحة"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "جرب تغيير معايير البحث"
                  : "ستظهر هنا تسجيلات الورش عند توفرها"}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-4"
                >
                  إعادة تعيين الفلاتر
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recordings Grid */}
        {!loading && filteredRecordings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecordings.map((recording) => (
              <Card
                key={recording.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handlePlayRecording(recording)}
              >
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:bg-primary transition-colors">
                      <Play className="h-8 w-8 text-primary-foreground mr-[-2px]" />
                    </div>
                  </div>
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {getCategoryLabel(recording.workshop.category)}
                  </Badge>
                  {recording.duration_seconds && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(recording.duration_seconds)}
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {recording.workshop.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {recording.workshop.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {recording.workshop.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{recording.workshop.host_name}</span>
                    {recording.recorded_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(recording.recorded_at), "dd MMM yyyy", {
                          locale: ar,
                        })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WorkshopRecordings;
