import { Sparkles, BookOpen, Users, Globe, Award, Heart, Play, ExternalLink } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import logoImage from "@/assets/logo.jpeg";

const milestones = [
  {
    year: "البداية",
    title: "رحلة التدبر",
    description: "بدأت رحلة أحمد الليث مع تدبر القرآن الكريم من السودان، حيث تعمّق في فهم اللسان العربي المبين وأسرار الجذور العربية.",
  },
  {
    year: "التأسيس",
    title: "المدرسة الترتيلية",
    description: "أسس المدرسة الترتيلية منصةً تعليمية للتدبر والوعي، تجمع بين عمق التراث وأدوات العصر الحديث.",
  },
  {
    year: "المنهج",
    title: "منهج الفصال",
    description: "طوّر منهج الفصال القائم على ثلاث مراحل: التخلية والتحلية والتجلّي، مستلهماً من قوله تعالى ﴿وَفِصَالُهُ فِي عَامَيْنِ﴾.",
  },
  {
    year: "الأثر",
    title: "مجتمع التعلم",
    description: "بنى مجتمعاً من المتدبرين والباحثين يتشاركون أدوات فهم اللسان العربي المبين والتدبر القرآني.",
  },
];

const pillars = [
  {
    icon: BookOpen,
    title: "اللسان العربي المبين",
    description: "فهم الجذور العربية الثلاثية وكشف طبقات المعنى اللغوي والدلالي في القرآن الكريم.",
  },
  {
    icon: Heart,
    title: "التدبر القرآني",
    description: "تجاوز الفهم السطحي إلى التأمل العميق في آيات الله وربطها بالواقع المعاش.",
  },
  {
    icon: Users,
    title: "الوعي المجتمعي",
    description: "نشر الوعي السوداني والعربي والإسلامي من خلال أدوات التدبر والتفكر.",
  },
  {
    icon: Globe,
    title: "الفصال المعرفي",
    description: "إعادة بناء المفاهيم وفصل الموروث عن الأصيل للوصول إلى جوهر المعنى.",
  },
];

const mediaAppearances = [
  {
    title: "لقاء مع قناة سودانية 24",
    description: "حوار حول منهج التدبر القرآني وفهم اللسان العربي المبين",
    type: "تلفزيون",
    url: "#",
  },
  {
    title: "برنامج الوعي السوداني",
    description: "سلسلة حلقات عن إعادة بناء المفاهيم والوعي",
    type: "بودكاست",
    url: "#",
  },
  {
    title: "محاضرة الفصال في عامين",
    description: "شرح فلسفة المدرسة الترتيلية ومنهج التخلية والتحلية والتجلي",
    type: "ورشة",
    url: "#",
  },
];

const Founder = () => {
  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-8 max-w-3xl mx-auto">
        {/* Hero Section */}
        <section className="relative text-center space-y-4 py-8 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-accent/8 rounded-full blur-3xl animate-breathe" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-primary/6 rounded-full blur-3xl animate-breathe delay-1000" />
          </div>

          <div className="relative w-32 h-32 mx-auto animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/25 to-primary/15 rounded-full blur-xl animate-breathe" />
            <div className="relative w-full h-full rounded-full overflow-hidden ring-2 ring-accent/30 shadow-xl bg-muted flex items-center justify-center">
              <span className="text-4xl font-display font-bold text-primary/60">أ ل</span>
            </div>
          </div>

          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-3xl font-display font-bold text-foreground">
              أحمد الليث
            </h1>
            <p className="text-accent font-display font-semibold text-lg">
              مؤسس المدرسة الترتيلية
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="w-10 h-px bg-gradient-to-r from-transparent to-accent" />
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              <span className="w-10 h-px bg-gradient-to-l from-transparent to-accent" />
            </div>
          </div>

          <p className="text-muted-foreground text-base leading-relaxed max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            متدبر سوداني ومؤسس المدرسة الترتيلية، رائد في مجال تدبر اللسان العربي المبين وعلوم القرآن الكريم.
            يسعى لإعادة اكتشاف أسرار اللغة العربية وربطها بفهم القرآن العميق.
          </p>
        </section>

        {/* Quote */}
        <section className="sanctuary-card text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="relative z-10 space-y-3">
            <p className="text-lg font-display text-primary/90 italic leading-relaxed">
              "من تعلّم اللسان العربي المبين، فقد أُوتي مفتاحاً عظيماً لفهم كلام الله"
            </p>
            <p className="text-sm text-muted-foreground">— أحمد الليث</p>
          </div>
        </section>

        {/* Pillars of Philosophy */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-xl text-foreground text-center">
            أركان الفلسفة الترتيلية
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={index}
                  className="sanctuary-card p-4 space-y-2 animate-fade-in"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="relative z-10 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-display font-bold text-foreground">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Journey / Milestones */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-xl text-foreground text-center">
            مسيرة التأسيس
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute right-5 top-0 bottom-0 w-px bg-gradient-to-b from-accent/40 via-primary/30 to-transparent" />

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="relative pr-12 animate-fade-in"
                  style={{ animationDelay: `${0.15 * index}s` }}
                >
                  {/* Dot */}
                  <div className="absolute right-3 top-1 w-4 h-4 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </div>

                  <div className="sanctuary-card p-4 space-y-1">
                    <div className="relative z-10">
                      <span className="text-xs text-accent font-display font-bold">{milestone.year}</span>
                      <h3 className="font-display font-bold text-foreground">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Media Appearances */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-xl text-foreground text-center">
            ظهورات إعلامية
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            حلقات ولقاءات في القنوات والبرامج المختلفة
          </p>
          <div className="space-y-3">
            {mediaAppearances.map((appearance, index) => (
              <div
                key={index}
                className="sanctuary-card p-4 animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="relative z-10 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-foreground text-sm">{appearance.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                        {appearance.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{appearance.description}</p>
                  </div>
                  {appearance.url !== "#" && (
                    <a href={appearance.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center italic">
            سيتم إضافة روابط الحلقات والبرامج قريباً
          </p>
        </section>

        {/* Three Stages */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-xl text-foreground text-center">
            منهج المدرسة الترتيلية
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="sanctuary-card text-center p-4">
              <div className="relative z-10">
                <div className="w-10 h-10 mx-auto bg-spiritual-green/10 rounded-full flex items-center justify-center mb-2">
                  <span className="text-lg">🌱</span>
                </div>
                <h3 className="text-sm font-display font-bold text-spiritual-green">تخلية</h3>
                <p className="text-[10px] text-muted-foreground mt-1">تنقية المفاهيم الموروثة</p>
              </div>
            </div>
            <div className="sanctuary-card text-center p-4">
              <div className="relative z-10">
                <div className="w-10 h-10 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-2">
                  <span className="text-lg">✨</span>
                </div>
                <h3 className="text-sm font-display font-bold text-accent">تحلية</h3>
                <p className="text-[10px] text-muted-foreground mt-1">تعلّم اللسان العربي</p>
              </div>
            </div>
            <div className="sanctuary-card text-center p-4">
              <div className="relative z-10">
                <div className="w-10 h-10 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <span className="text-lg">👑</span>
                </div>
                <h3 className="text-sm font-display font-bold text-primary">تجلّي</h3>
                <p className="text-[10px] text-muted-foreground mt-1">تطبيق الحكمة</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="sanctuary-card text-center space-y-3 animate-fade-in">
          <div className="relative z-10 space-y-3">
            <Award className="h-8 w-8 text-accent mx-auto" />
            <h3 className="font-display font-semibold text-foreground">
              انضم إلى المدرسة الترتيلية
            </h3>
            <p className="text-sm text-muted-foreground">
              ابدأ رحلتك في تعلّم اللسان العربي المبين وتدبر كلام الله
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Founder;
