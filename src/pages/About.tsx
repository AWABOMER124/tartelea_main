import AppLayout from "@/components/layout/AppLayout";
import PageMeta from "@/components/seo/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Target, Globe, Award, MessageCircle, Headphones, GraduationCap } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "المكتبة",
    description: "مقالات ومواد صوتية ومرئية في اللسان العربي وعلوم القرآن، مصنفة حسب المستوى والموضوع.",
  },
  {
    icon: GraduationCap,
    title: "الدورات والمسارات",
    description: "دروس مرتبة ضمن مسارات، مع متابعة التقدم وشهادات الإتمام عند توفرها.",
  },
  {
    icon: Headphones,
    title: "اللقاءات الصوتية",
    description: "لقاءات حية للنقاش والتعلّم الجماعي، مع التسجيل والمراجعة عند توفرهما.",
  },
  {
    icon: Users,
    title: "المجتمع",
    description: "مساحة للنقاش وتبادل الأسئلة والمعرفة بين الطلاب والمدربين.",
  },
  {
    icon: MessageCircle,
    title: "مساعد التدبّر",
    description: "أداة تساعدك على البحث في الألفاظ والجذور وتنظيم أسئلتك أثناء التدبّر.",
  },
  {
    icon: Award,
    title: "ورش العمل",
    description: "ورش حية في موضوعات اللسان العربي وعلوم القرآن وأدوات التدبّر.",
  },
];

const values = [
  {
    icon: Target,
    title: "رسالتنا",
    description: "تعليم أدوات التدبّر واللسان العربي بطريقة منظمة يمكن للطالب فهمها وتطبيقها.",
  },
  {
    icon: Globe,
    title: "رؤيتنا",
    description: "توفير بيئة تعليمية تجمع المسارات والدروس واللقاءات والمكتبة في مكان واحد.",
  },
];

const About = () => {
  return (
    <AppLayout>
      <PageMeta
        title="من نحن"
        description="المدرسة الترتيلية منصة تعليمية لأدوات تدبّر القرآن واللسان العربي، وتضم مسارات ودروساً ولقاءات ومكتبة."
        path="/about"
        keywords="من نحن, المدرسة الترتيلية, تعليم العربية, علوم القرآن, منصة تعليمية"
      />

      <div className="px-4 py-8 max-w-4xl mx-auto space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            المدرسة الترتيلية
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            منصة تعليمية لتعلّم أدوات تدبّر القرآن واللسان العربي من خلال المسارات والدروس واللقاءات والمكتبة.
          </p>
          <div className="w-20 h-1 bg-accent rounded-full mx-auto" />
        </section>

        {/* Vision & Mission */}
        <section className="grid md:grid-cols-2 gap-6">
          {values.map((item) => (
            <Card key={item.title} className="border-accent/20 bg-accent/5">
              <CardContent className="p-6 space-y-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
                  <item.icon className="h-7 w-7 text-accent" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground">{item.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* About Text for SEO */}
        <section className="space-y-4">
          <h2 className="text-2xl font-display font-bold text-foreground text-center">عن المدرسة الترتيلية</h2>
          <div className="prose prose-lg max-w-none text-foreground/85 leading-loose space-y-4">
            <p>
              المدرسة الترتيلية منصة تعليمية تركّز على أدوات تدبّر القرآن وفهم اللسان العربي. من الأدوات التي تُدرّس في المدرسة: الخلع، والترتيل، والتفكيك، والتجريد، وغيرها.
            </p>
            <p>
              يُقدَّم المحتوى من خلال مسارات ودروس وورش ولقاءات صوتية، إضافة إلى مكتبة يمكن تصفحها حسب الموضوع والمستوى.
            </p>
            <p>
              يستطيع الطالب متابعة تقدّمه، الرجوع إلى المواد السابقة، والمشاركة في النقاشات واللقاءات من داخل المنصة.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-foreground text-center">مكوّنات المنصة</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </div>
    </AppLayout>
  );
};

export default About;
