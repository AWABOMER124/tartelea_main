import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Library, PlaySquare, Video, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageMeta from "@/components/seo/PageMeta";

const learnDestinations = [
  {
    to: "/courses",
    icon: GraduationCap,
    title: "المسارات",
    description: "تعلّم متدرّج يقودك من الأساس إلى التطبيق.",
    tone: "bg-spiritual-green/10 text-spiritual-green",
  },
  {
    to: "/library",
    icon: Library,
    title: "المكتبة",
    description: "مقالات وصوتيات ومرئيات مرتبة حسب الموضوع والمستوى.",
    tone: "bg-primary/10 text-primary",
  },
  {
    to: "/workshops",
    icon: Video,
    title: "الورش",
    description: "لقاءات تعليمية تطبيقية مع مدرّبي المدرسة.",
    tone: "bg-accent/15 text-accent-foreground",
  },
  {
    to: "/workshop-recordings",
    icon: PlaySquare,
    title: "التسجيلات",
    description: "عُد إلى الورش المسجّلة وتعلّم في وقتك.",
    tone: "bg-secondary text-secondary-foreground",
  },
];

const Learn = () => (
  <AppLayout>
    <PageMeta title="تعلّم" description="مسارات ومكتبة وورش المدرسة الترتيلية في مكان واحد." path="/learn" />
    <div className="page-shell max-w-6xl space-y-8">
      <header className="max-w-2xl space-y-2">
        <span className="text-sm font-semibold text-spiritual-green">رحلتك التعليمية</span>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">تعلّم بوضوح، خطوة بعد خطوة</h1>
        <p className="leading-7 text-muted-foreground">كل أدوات التعلّم في وجهة واحدة، من المسار المنهجي إلى المادة التي تحتاجها الآن.</p>
      </header>

      <section aria-label="أقسام التعلّم" className="grid gap-4 md:grid-cols-2">
        {learnDestinations.map(({ to, icon: Icon, title, description, tone }) => (
          <Link key={to} to={to} className="group rounded-xl border border-border bg-card p-5 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-start gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-foreground">{title}</h2>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-secondary/45 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-5 w-5 shrink-0 text-spiritual-green" />
          <div>
            <h2 className="font-bold text-foreground">مجالات الوعي</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">موضوعات الوعي أصبحت مجالات داخل التعلّم، وليست وجهات تنقّل رئيسية.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link to="/sudan-awareness" className="rounded-full border border-border bg-card px-3 py-2 hover:border-primary/25">الوعي السوداني</Link>
              <Link to="/arab-awareness" className="rounded-full border border-border bg-card px-3 py-2 hover:border-primary/25">الوعي العربي</Link>
              <Link to="/islamic-awareness" className="rounded-full border border-border bg-card px-3 py-2 hover:border-primary/25">الوعي الإسلامي</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
);

export default Learn;
