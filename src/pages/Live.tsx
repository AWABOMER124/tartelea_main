import { Link } from "react-router-dom";
import { Archive, ArrowLeft, CalendarClock, Headphones, Radio, Video } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageMeta from "@/components/seo/PageMeta";
import UpcomingWorkshopsAnnouncement from "@/components/workshops/UpcomingWorkshopsAnnouncement";

const liveDestinations = [
  { to: "/rooms", icon: Headphones, title: "الغرف الصوتية", description: "ادخل الغرف المباشرة أو استعرض الجلسات القادمة." },
  { to: "/workshops", icon: Video, title: "الورش المباشرة", description: "تابع الورش القادمة وسجّل حضورك." },
  { to: "/room-recordings", icon: Archive, title: "تسجيلات الغرف", description: "استمع إلى الجلسات المتاحة بعد انتهائها." },
  { to: "/workshop-recordings", icon: CalendarClock, title: "تسجيلات الورش", description: "شاهد الورش المسجّلة في الوقت المناسب لك." },
];

const Live = () => (
  <AppLayout>
    <PageMeta title="مباشر" description="الغرف والورش المباشرة والقادمة في المدرسة الترتيلية." path="/live" />
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="max-w-2xl space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-spiritual-green"><Radio className="h-4 w-4" /> مباشر وقادم</div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">كن قريباً من اللقاء</h1>
        <p className="leading-7 text-muted-foreground">الغرف والجلسات والورش القادمة في مكان واحد، مع التسجيلات للعودة إليها لاحقاً.</p>
      </header>

      <UpcomingWorkshopsAnnouncement />

      <section aria-label="أقسام البث والجلسات" className="grid gap-3 sm:grid-cols-2">
        {liveDestinations.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to} className="group rounded-2xl border border-border bg-card p-5 shadow-sm outline-none transition-colors hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-spiritual-green/10 text-spiritual-green"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-foreground">{title}</h2><ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" /></div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  </AppLayout>
);

export default Live;
