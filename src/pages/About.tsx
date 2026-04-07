import AppLayout from "@/components/layout/AppLayout";
import PageMeta from "@/components/seo/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Target, Globe, Award, MessageCircle, Headphones, GraduationCap } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "مكتبة علمية شاملة",
    description: "مقالات ومواد صوتية ومرئية متخصصة في اللسان العربي المبين وعلوم القرآن الكريم، مصنفة حسب المستوى والموضوع.",
  },
  {
    icon: GraduationCap,
    title: "دورات ومسارات تعليمية",
    description: "مسارات تعليمية منهجية يقدمها مدربون متخصصون، مع شهادات إتمام وتتبع تقدم متقدم.",
  },
  {
    icon: Headphones,
    title: "غرف صوتية تفاعلية",
    description: "غرف صوتية حية للنقاش والتعلم الجماعي مع إمكانية التسجيل والمراجعة.",
  },
  {
    icon: Users,
    title: "مجتمع تفاعلي",
    description: "منصة مجتمعية لتبادل المعرفة والنقاشات العلمية بين الطلاب والمدربين.",
  },
  {
    icon: MessageCircle,
    title: "تدبر القرآن بالذكاء الاصطناعي",
    description: "أداة تدبر ذكية تساعدك في فهم معاني كلام الله وتحليل الجذور العربية.",
  },
  {
    icon: Award,
    title: "ورش عمل متخصصة",
    description: "ورش عمل حية يقدمها خبراء في مجالات اللسان العربي وعلوم القرآن.",
  },
];

const values = [
  {
    icon: Target,
    title: "رسالتنا",
    description: "نشر علوم اللسان العربي المبين وتيسير فهم كلام الله تعالى من خلال منهج علمي رصين يجمع بين الأصالة والمعاصرة.",
  },
  {
    icon: Globe,
    title: "رؤيتنا",
    description: "أن نكون المرجع الأول عالمياً في تعليم اللسان العربي المبين وعلوم القرآن الكريم رقمياً، وصناعة جيل واعٍ بلسانه وهويته.",
  },
];

const About = () => {
  return (
    <AppLayout>
      <PageMeta
        title="من نحن"
        description="المدرسة الترتيلية - منصة تعليمية رائدة متخصصة في اللسان العربي المبين وعلوم القرآن الكريم. تعرّف على رسالتنا ورؤيتنا وما نقدمه من خدمات تعليمية."
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
            منصة تعليمية متخصصة في اللسان العربي المبين وعلوم القرآن الكريم، تهدف إلى إعادة الوصل بين الإنسان العربي ولسانه المبين وبين كلام ربه.
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
              المدرسة الترتيلية هي مؤسسة تعليمية رقمية تأسست بهدف إحياء علوم اللسان العربي المبين وتيسير فهم القرآن الكريم. نؤمن بأن اللغة العربية ليست مجرد وسيلة تواصل، بل هي مفتاح لفهم كلام الله تعالى وتدبر آياته.
            </p>
            <p>
              تقدم المدرسة الترتيلية محتوى تعليمياً متنوعاً يشمل دورات في علوم القرآن، وتحليل الجذور العربية، والوعي العربي والإسلامي والسوداني. يقدم هذا المحتوى نخبة من المدربين المتخصصين عبر مسارات تعليمية منهجية وورش عمل تفاعلية وغرف صوتية حية.
            </p>
            <p>
              نسعى في المدرسة الترتيلية إلى بناء مجتمع تعليمي متكامل يجمع بين طلاب العلم والمدربين في بيئة تفاعلية تشجع على التعلم المستمر وتبادل المعرفة. منصتنا مفتوحة لكل من يرغب في التعمق في فهم لسانه العربي وكتاب ربه.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-foreground text-center">ما نقدمه</h2>
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

        {/* Stats */}
        <section className="bg-primary/5 rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "دورة تعليمية", value: "+" },
              { label: "ورشة عمل", value: "+" },
              { label: "غرفة صوتية", value: "+" },
              { label: "مجتمع نشط", value: "✓" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default About;
