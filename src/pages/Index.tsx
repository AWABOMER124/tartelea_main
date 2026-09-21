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
    <div className="space-y-10 sm:space-y-12">
      <header className="space-y-1"><p className="text-sm text-muted-foreground">السلام عليك، {name}</p><h1 className="text-2xl font-bold text-foreground sm:text-3xl">ما خطوتك التالية اليوم؟</h1></header>

      <section aria-labelledby="continue-title" className="rounded-2xl border border-primary/15 bg-primary p-5 text-primary-foreground  sm:p-7">
        <p className="text-xs font-semibold text-primary-foreground/70">واصل التعلّم</p>
        {progressLoading ? (
          <div className="flex min-h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" aria-label="جارٍ تحميل تقدّمك" /></div>
        ) : course && progress !== null ? (
          <div className="mt-3 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div><h2 id="continue-title" className="text-xl font-bold sm:text-2xl">{course.title}</h2><p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-primary-foreground/75">{course.description || "تابع من النقطة التي وصلت إليها في هذا المسار."}</p><div className="mt-5 max-w-xl" aria-label={`اكتمل ${progress}%`}><div className="mb-2 flex justify-between text-xs"><span>تقدّمك</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} /></div></div></div>
            <Button asChild variant="secondary" className="min-h-11"><Link to={`/courses/${course.id}`}><Play className="ml-2 h-4 w-4" />أكمل من حيث توقفت</Link></Button>
          </div>
        ) : (
          <div className="mt-3 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end"><div><h2 id="continue-title" className="text-xl font-bold sm:text-2xl">ابدأ أول مسار لك</h2><p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75">حين تبدأ التعلّم سيظهر تقدّمك هنا، لتعود دائماً إلى خطوتك التالية مباشرة.</p></div><Button asChild variant="secondary" className="min-h-11"><Link to="/courses"><Compass className="ml-2 h-4 w-4" />اختر مسارك</Link></Button></div>
        )}
      </section>

      <section className="space-y-5">
        <SectionHeading eyebrow="خريطة المدرسة" title="رحلتك: تخلية، تحلية، ثم تجلّي" />
        <div className="relative grid gap-3 md:grid-cols-3">
          {journeyStages.map((stage, index) => (
            <article key={stage.title} className="relative rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stage.tone}`}>{index === 0 ? <Circle className="h-4 w-4" /> : index === 1 ? <BookOpen className="h-4 w-4" /> : <Check className="h-4 w-4" />}</span><span className="text-xs text-muted-foreground">المحطة {index + 1}</span></div><h3 className="font-bold">{stage.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{stage.description}</p></article>
          ))}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">هذه خريطة المنهج وليست نسبة إنجاز. سيُربط تقدّم الرحلة بسجل التعلّم في مرحلة لاحقة.</p>
      </section>

      <section className="space-y-5">
        <SectionHeading eyebrow="مباشر وقادم" title="اقترب من اللقاء" to="/live" linkLabel="كل الجلسات" />
        {workshopsLoading ? <div className="h-32 animate-pulse rounded-2xl bg-muted" /> : nextWorkshop ? (
          <Link to={`/workshops/${nextWorkshop.id}`} className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/25 sm:flex-row sm:items-center"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-spiritual-green/10 text-spiritual-green"><CalendarClock className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-spiritual-green">{nextWorkshop.is_live ? "مباشر الآن" : format(new Date(nextWorkshop.scheduled_at), "EEEE، d MMMM · HH:mm", { locale: ar })}</p><h3 className="mt-1 font-bold">{nextWorkshop.title}</h3><p className="mt-1 text-sm text-muted-foreground">مع {nextWorkshop.host_name || "مدرّب المدرسة"}</p></div><span className="flex min-h-11 items-center gap-2 self-start rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground sm:self-auto">التفاصيل<ChevronLeft className="h-4 w-4" /></span></Link>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-card/60 p-5 sm:flex-row sm:items-center"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Radio className="h-5 w-5" /></span><div className="flex-1"><h3 className="font-bold">لا توجد جلسة قادمة معلنة الآن</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">يمكنك استكشاف التسجيلات أو مراجعة صفحة المباشر لاحقاً.</p></div><Link to="/live" className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary">استكشف مباشر<ArrowLeft className="h-4 w-4" /></Link></div>
        )}
      </section>

      {!coursesLoading && courses.length > 0 && (
        <section className="space-y-5"><SectionHeading eyebrow="مختار لك" title="من المدرسة" to="/learn" linkLabel="المزيد" /><div className="grid gap-3 sm:grid-cols-2">{courses.slice(0, 2).map((item) => <Link key={item.id} to={`/courses/${item.id}`} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/25"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Headphones className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="line-clamp-1 font-bold group-hover:text-primary">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description || "محتوى مختار من المدرسة الترتيلية."}</p></div></div></Link>)}</div></section>
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
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {authLoading ? <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="جارٍ تحميل الصفحة" /></div> : user ? <MemberHome userId={user.id} name={name} /> : <GuestHome />}
        {!authLoading && user && !hasSubscription && <section className="mt-10 flex flex-col gap-4 rounded-2xl border border-accent/25 bg-accent/5 p-5 sm:flex-row sm:items-center"><Crown className="h-7 w-7 shrink-0 text-accent" /><div className="flex-1"><h2 className="font-bold">وسّع رحلتك مع العضوية</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">وصول أوسع إلى مزايا المدرسة ومساعد التدبّر.</p></div><Button asChild variant="outline"><Link to="/subscription">عرض العضوية</Link></Button></section>}
      </div>
    </AppLayout>
  );
};

export default Index;
