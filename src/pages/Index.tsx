import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CalendarClock, Check, ChevronLeft, Circle, Compass, Crown, Headphones, Loader2, Play, Radio, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useContinueLearning, useFeaturedCourses } from "@/hooks/useCourses";
import { useUpcomingWorkshops } from "@/hooks/useWorkshops";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import PageMeta from "@/components/seo/PageMeta";
import logoImage from "@/assets/logo.jpeg";
import dashboardLearning from "@/assets/dashboard-learning.svg";
import { format, ar } from "@/lib/date-utils";

const journeyStages = [
  { title: "تخلية", description: "تفكيك المفاهيم المعيقة", tone: "bg-spiritual-green/10 text-spiritual-green" },
  { title: "تحلية", description: "بناء اللسان وأدوات الفهم", tone: "bg-accent/15 text-accent-foreground" },
  { title: "تجلّي", description: "تحويل الفهم إلى أثر وعمل", tone: "bg-primary/10 text-primary" },
];

const SectionHeading = ({ eyebrow, title, to, linkLabel }: { eyebrow?: string; title: string; to?: string; linkLabel?: string }) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      {eyebrow && <p className="mb-1 text-xs font-semibold text-spiritual-green">{eyebrow}</p>}
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
    {to && <Link to={to} className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5">{linkLabel ?? "عرض الكل"}<ArrowLeft className="h-4 w-4" /></Link>}
  </div>
);

const GuestHome = () => {
  const { courses, isLoading } = useFeaturedCourses();

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="grid items-center gap-8 rounded-2xl border border-border bg-card px-5 py-8  sm:px-10 sm:py-12 md:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-spiritual-green/10 px-3 py-1.5 text-sm font-semibold text-spiritual-green"><Sparkles className="h-4 w-4" /> مدرسة رقمية لرحلة أهدأ وأوضح</span>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">تعلّم اللسان العربي، وافتح باباً أعمق لتدبّر القرآن</h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">رحلة متدرجة تجمع المسارات والمكتبة واللقاءات الحية في مكان واحد، لتعرف دائماً أين أنت وما خطوتك التالية.</p>
          </div>
          <Button asChild size="lg" className="min-h-12 px-6"><Link to="/auth">ابدأ رحلتك الآن <ArrowLeft className="mr-2 h-4 w-4" /></Link></Button>
          <p className="font-display text-base text-primary/80">﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾</p>
        </div>
        <div className="mx-auto hidden w-full max-w-[240px] md:block">
          <div className="rounded-2xl bg-secondary/75 p-4"><img src={logoImage} alt="شعار المدرسة الترتيلية" className="aspect-square w-full rounded-2xl object-cover" /></div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading eyebrow="منهج واضح" title="رحلة واحدة، بثلاث محطات" />
        <div className="grid gap-3 md:grid-cols-3">
          {journeyStages.map((stage, index) => (
            <article key={stage.title} className="rounded-xl border border-border bg-card p-5">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${stage.tone}`}>{index + 1}</div>
              <h3 className="text-lg font-bold">{stage.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{stage.description}</p>
            </article>
          ))}
        </div>
      </section>

      {!isLoading && courses.length > 0 && (
        <section className="space-y-5">
          <SectionHeading eyebrow="ابدأ بما يناسبك" title="مختار من المدرسة" to="/learn" linkLabel="استكشف التعلّم" />
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.slice(0, 2).map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/25">
                <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="font-bold group-hover:text-primary">{course.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{course.description || "مسار تعليمي من المدرسة الترتيلية."}</p></div><ChevronLeft className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const MemberHome = ({ userId, name }: { userId: string; name: string }) => {
  const { course, progress, isLoading: progressLoading } = useContinueLearning(userId);
  const { courses, isLoading: coursesLoading } = useFeaturedCourses();
  const { workshops, isLoading: workshopsLoading } = useUpcomingWorkshops(1);
  const nextWorkshop = workshops[0];

  return (
    <div className="space-y-7 lg:space-y-8">
      <header className="flex flex-col gap-1">
        <p className="reference-eyebrow">مرحباً بك في المدرسة</p>
        <h1 className="reference-title">مرحباً {name} 👋</h1>
        <p className="reference-copy">كل خطوة في طلب العلم تقرّبك. تابع رحلتك من المكان الذي توقفت عنده.</p>
      </header>

      <section className="reference-card overflow-hidden">
        <div className="grid min-h-[250px] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col justify-between p-5 sm:p-7">
            <div>
              <p className="reference-eyebrow">أكمل رحلتك اليوم</p>
              {progressLoading ? (
                <div className="mt-6 flex min-h-28 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : course && progress !== null ? (
                <>
                  <h2 className="mt-2 text-2xl font-bold text-foreground">{course.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                    {course.description || "تابع من النقطة التي وصلت إليها في هذا المسار."}
                  </p>
                  <div className="mt-6 max-w-xl">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>تقدّمك في المسار</span>
                      <span className="font-bold text-foreground">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-2xl font-bold text-foreground">ابدأ أول مسار لك</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    اختر مسارك الأول، وسيظهر تقدّمك وخطوتك التالية هنا مباشرة.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6">
              <Button asChild>
                <Link to={course ? `/courses/${course.id}` : "/courses"}>
                  {course ? <Play className="ml-1 h-4 w-4" /> : <Compass className="ml-1 h-4 w-4" />}
                  {course ? "متابعة الدرس" : "اختر مسارك"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden bg-primary lg:min-h-full">
            <img
              src={dashboardLearning}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/45 via-transparent to-transparent" />
            <div className="absolute bottom-5 right-5 left-5 rounded-[9px] border border-white/10 bg-black/20 p-3 text-white backdrop-blur-sm">
              <p className="text-xs text-white/70">رحلة العلم</p>
              <p className="mt-1 font-display text-lg font-bold">﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="reference-card flex items-center gap-3 p-4">
          <span className="reference-icon-green"><BookOpen className="h-5 w-5" /></span>
          <div>
            <p className="text-xl font-bold text-foreground">{coursesLoading ? "—" : courses.length}</p>
            <p className="text-xs text-muted-foreground">مسارات متاحة</p>
          </div>
        </div>
        <div className="reference-card flex items-center gap-3 p-4">
          <span className="reference-icon-gold"><Play className="h-5 w-5" /></span>
          <div>
            <p className="text-xl font-bold text-foreground">{progressLoading || progress === null ? "—" : `${progress}%`}</p>
            <p className="text-xs text-muted-foreground">تقدّم المسار الحالي</p>
          </div>
        </div>
        <div className="reference-card flex items-center gap-3 p-4">
          <span className="reference-icon"><Radio className="h-5 w-5" /></span>
          <div>
            <p className="text-xl font-bold text-foreground">{workshopsLoading ? "—" : nextWorkshop ? "1" : "0"}</p>
            <p className="text-xs text-muted-foreground">لقاء قادم</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="رحلتي التعليمية" title="المسار خطوة بخطوة" to="/learn" linkLabel="عرض كل المسارات" />
        <div className="reference-card p-4 sm:p-5">
          <div className="space-y-2">
            {journeyStages.map((stage, index) => (
              <div key={stage.title} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[9px] border border-border/80 bg-background/35 p-3 sm:p-4">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? "bg-spiritual-green text-white" : index === 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">المرحلة {index + 1}</p>
                  <h3 className="font-bold text-foreground">{stage.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
                </div>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="مباشر وقادم" title="اقترب من اللقاء" to="/live" linkLabel="كل الجلسات" />
        {workshopsLoading ? (
          <div className="h-28 animate-pulse rounded-[10px] bg-muted" />
        ) : nextWorkshop ? (
          <Link
            to={`/workshops/${nextWorkshop.id}`}
            className="reference-card reference-card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
          >
            <span className="reference-icon-green"><CalendarClock className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-spiritual-green">
                {nextWorkshop.is_live ? "مباشر الآن" : format(new Date(nextWorkshop.scheduled_at), "EEEE، d MMMM · HH:mm", { locale: ar })}
              </p>
              <h3 className="mt-1 font-bold text-foreground">{nextWorkshop.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">مع {nextWorkshop.host_name || "مدرّب المدرسة"}</p>
            </div>
            <span className="flex min-h-10 items-center gap-1 text-sm font-semibold text-primary">التفاصيل <ChevronLeft className="h-4 w-4" /></span>
          </Link>
        ) : (
          <div className="reference-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <span className="reference-icon"><Radio className="h-5 w-5" /></span>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">لا توجد جلسة قادمة معلنة الآن</h3>
              <p className="mt-1 text-sm text-muted-foreground">يمكنك مراجعة التسجيلات أو صفحة اللقاءات المباشرة.</p>
            </div>
            <Link to="/live" className="text-sm font-semibold text-primary">استكشف مباشر</Link>
          </div>
        )}
      </section>

      {!coursesLoading && courses.length > 0 && (
        <section className="space-y-4">
          <SectionHeading eyebrow="مختار لك" title="من المدرسة" to="/learn" linkLabel="المزيد" />
          <div className="grid gap-3 md:grid-cols-2">
            {courses.slice(0, 2).map((item) => (
              <Link key={item.id} to={`/courses/${item.id}`} className="reference-card reference-card-hover flex items-start gap-4 p-4">
                <span className="reference-icon"><Headphones className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 font-bold text-foreground">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description || "محتوى مختار من المدرسة الترتيلية."}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasSubscription } = useSubscription();
  const name = user?.full_name?.trim() || user?.email?.split("@")[0] || "طالب العلم";

  return (
    <AppLayout>
      <PageMeta title="الرئيسية" description="المدرسة الترتيلية - رحلة واضحة في اللسان العربي المبين وعلوم القرآن." path="/" />
      <div className="page-shell max-w-7xl">
        {authLoading ? <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="جارٍ تحميل الصفحة" /></div> : user ? <MemberHome userId={user.id} name={name} /> : <GuestHome />}
        {!authLoading && user && !hasSubscription && <section className="mt-10 flex flex-col gap-4 rounded-2xl border border-accent/25 bg-accent/5 p-5 sm:flex-row sm:items-center"><Crown className="h-7 w-7 shrink-0 text-accent" /><div className="flex-1"><h2 className="font-bold">وسّع رحلتك مع العضوية</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">وصول أوسع إلى مزايا المدرسة ومساعد التدبّر.</p></div><Button asChild variant="outline"><Link to="/subscription">عرض العضوية</Link></Button></section>}
      </div>
    </AppLayout>
  );
};

export default Index;
