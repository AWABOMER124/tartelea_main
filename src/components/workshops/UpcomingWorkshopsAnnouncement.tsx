import { useState, useEffect, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, Video, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { format, ar } from "@/lib/date-utils";
import { useUpcomingWorkshops } from "@/hooks/useWorkshops";

const categoryConfig: Record<string, { label: string; gradient: string; icon: string }> = {
  quran: { label: "القرآن", gradient: "from-primary/80 to-primary/40", icon: "📖" },
  values: { label: "القيم", gradient: "from-accent/80 to-accent/40", icon: "💎" },
  community: { label: "المجتمع", gradient: "from-spiritual-green/80 to-spiritual-green/40", icon: "🤝" },
  sudan_awareness: { label: "الوعي السوداني", gradient: "from-destructive/80 to-destructive/40", icon: "🇸🇩" },
  arab_awareness: { label: "الوعي العربي", gradient: "from-accent/80 to-accent/40", icon: "🌍" },
  islamic_awareness: { label: "الوعي الإسلامي", gradient: "from-primary/80 to-primary/40", icon: "✨" },
};

const WorkshopSlide = memo(({ workshop, isAnimating }: { workshop: any; isAnimating: boolean }) => {
  const config = categoryConfig[workshop.category] || categoryConfig.quran;
  const scheduledDate = new Date(workshop.scheduled_at);

  if (workshop.image_url) {
    return (
      <div className={`relative h-48 transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <img
          src={workshop.image_url}
          alt={workshop.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="h-6 w-6 text-white fill-white ml-1" />
          </div>
        </div>
        
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 w-fit mb-2 backdrop-blur-sm">
            {config.label}
          </Badge>
          <h3 className="text-xl font-bold text-white line-clamp-2 mb-1">
            {workshop.title}
          </h3>
          {workshop.description && (
            <p className="text-white/80 text-sm line-clamp-1 mb-2">
              {workshop.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
              <Calendar className="h-4 w-4" />
              {format(scheduledDate, "dd MMMM", { locale: ar })}
            </span>
            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
              <Clock className="h-4 w-4" />
              {format(scheduledDate, "HH:mm")}
            </span>
            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
              <Users className="h-4 w-4" />
              {workshop.participant_count}/{workshop.max_participants}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gradient-to-br ${config.gradient} p-6 min-h-[180px] transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute top-4 left-4 text-4xl opacity-20">
        {config.icon}
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10 space-y-3">
        <Badge variant="secondary" className="bg-white/20 text-white border-0">
          {config.label}
        </Badge>
        
        <h3 className="text-xl font-bold text-white line-clamp-2">
          {workshop.title}
        </h3>
        
        {workshop.description && (
          <p className="text-white/80 text-sm line-clamp-2">
            {workshop.description}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
          <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
            <Calendar className="h-4 w-4" />
            {format(scheduledDate, "dd MMMM", { locale: ar })}
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            {format(scheduledDate, "HH:mm")}
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
            <Users className="h-4 w-4" />
            {workshop.participant_count}/{workshop.max_participants}
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-white/70 text-sm">
            المدرب: {workshop.host_name}
          </span>
          <Button
            asChild
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            <Link to={`/workshops/${workshop.id}`}>
              التفاصيل
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
});

WorkshopSlide.displayName = "WorkshopSlide";

const UpcomingWorkshopsAnnouncement = () => {
  const { workshops, isLoading } = useUpcomingWorkshops(5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNextSlide = useCallback(() => {
    if (isAnimating || workshops.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % workshops.length);
    setTimeout(() => setIsAnimating(false), 200);
  }, [isAnimating, workshops.length]);

  const handlePrevSlide = useCallback(() => {
    if (isAnimating || workshops.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + workshops.length) % workshops.length);
    setTimeout(() => setIsAnimating(false), 200);
  }, [isAnimating, workshops.length]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (workshops.length <= 1) return;
    
    const interval = setInterval(handleNextSlide, 5000);
    return () => clearInterval(interval);
  }, [workshops.length, handleNextSlide]);

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </section>
    );
  }

  if (workshops.length === 0) {
    return null;
  }

  const currentWorkshop = workshops[currentIndex];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
          <div className="relative">
            <Video className="h-5 w-5 text-destructive" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
          </div>
          الورش القادمة
        </h2>
        <Link to="/workshops" className="text-sm text-primary hover:underline flex items-center gap-1 group">
          عرض الكل
          <span className="transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
        </Link>
      </div>

      <div className="relative">
        <Card className="overflow-hidden border-0 shadow-lg group">
          <WorkshopSlide workshop={currentWorkshop} isAnimating={isAnimating} />
        </Card>

        {workshops.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              disabled={isAnimating}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={handleNextSlide}
              disabled={isAnimating}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}

        {workshops.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {workshops.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentIndex(index);
                    setTimeout(() => setIsAnimating(false), 200);
                  }
                }}
                className={`h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingWorkshopsAnnouncement;
