import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Heart, Globe, Sparkles, GraduationCap, Video, Headphones, Crown, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import FeaturedCourses from "@/components/courses/FeaturedCourses";
import GlobalSearch from "@/components/search/GlobalSearch";
import PageMeta from "@/components/seo/PageMeta";
import UpcomingWorkshopsAnnouncement from "@/components/workshops/UpcomingWorkshopsAnnouncement";
import TrendingPostsTicker from "@/components/home/TrendingPostsTicker";
import LatestContentTicker from "@/components/home/LatestContentTicker";
import logoImage from "@/assets/logo.jpeg";

const NavButton = ({ to, icon: Icon, label, iconColor, bgColor, hoverBg, hoverBorder }: { 
  to: string; icon: LucideIcon; label: string; 
  iconColor: string; bgColor: string; hoverBg: string; hoverBorder: string;
}) => (
  <Link to={to} className="group">
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border shadow-sm transition-all duration-300 group-hover:shadow-md ${hoverBorder} ${hoverBg}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${bgColor}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  </Link>
);

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkSub = async () => {
      const { data } = await supabase
        .from("monthly_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      setIsSubscribed(!!data);
    };
    checkSub();
  }, [user]);

  return (
    <AppLayout>
      <PageMeta title="الرئيسية" description="المدرسة الترتيلية - منصة تعليمية في اللسان العربي المبين وعلوم القرآن. دورات، ورش، غرف صوتية ومجتمع تفاعلي." path="/" />
      <div className="px-4 py-4 sm:py-6 space-y-5 sm:space-y-6">
        {/* Hero Section */}
        <section className="relative py-8 sm:py-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-accent/8 rounded-full blur-3xl animate-breathe" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-primary/6 rounded-full blur-3xl animate-breathe delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sanctuary-glow/5 rounded-full blur-3xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6">
            <div className="hidden md:block animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <TrendingPostsTicker />
            </div>
            <div className="text-center">
              <div className="relative w-36 h-36 mx-auto mb-4 animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/25 to-primary/15 rounded-full blur-xl animate-breathe" />
                <img src={logoImage} alt="شعار المدرسة الترتيلية" className="relative w-full h-full object-cover rounded-2xl shadow-xl ring-2 ring-accent/30" />
              </div>
            </div>
            <div className="hidden md:block animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <LatestContentTicker />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:hidden mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <TrendingPostsTicker />
            <LatestContentTicker />
          </div>

          <div className="text-center space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">المدرسة الترتيلية</h1>
            <p className="text-sm text-muted-foreground font-display">منصة اللسان العربي المبين وعلوم القرآن الكريم</p>
            <div className="flex items-center justify-center gap-2">
              <span className="w-10 h-px bg-gradient-to-r from-transparent to-accent" />
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              <span className="w-10 h-px bg-gradient-to-l from-transparent to-accent" />
            </div>
          </div>

          <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>تعلّم اللسان العربي المبين وتدبّر كلام الله</p>

          <div className="bg-gradient-to-r from-transparent via-accent/5 to-transparent py-3 px-4 rounded-2xl text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm font-display text-primary/80 italic">﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾</p>
          </div>
        </section>

        <GlobalSearch />

        <section className="grid grid-cols-3 gap-3">
          {[
            { emoji: "🌱", title: "تخلية", desc: "تنقية المفاهيم", color: "text-spiritual-green", bg: "bg-spiritual-green/10" },
            { emoji: "📖", title: "تحلية", desc: "تعلّم اللسان", color: "text-accent", bg: "bg-accent/10" },
            { emoji: "🌟", title: "تجلّي", desc: "تطبيق الفهم", color: "text-primary", bg: "bg-primary/10" },
          ].map((s) => (
            <div key={s.title} className="sanctuary-card text-center p-4">
              <div className="relative z-10">
                <div className={`w-10 h-10 mx-auto ${s.bg} rounded-full flex items-center justify-center mb-2`}>
                  <span className="text-lg">{s.emoji}</span>
                </div>
                <h3 className={`text-sm font-display font-bold ${s.color}`}>{s.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <FeaturedCourses />

        <section className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-foreground text-center">استكشف المنصة</h2>
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
            <NavButton to="/library" icon={BookOpen} label="المكتبة" iconColor="text-primary" bgColor="bg-primary/10" hoverBg="group-hover:bg-primary/5" hoverBorder="group-hover:border-primary/30" />
            <NavButton to="/community" icon={Users} label="المجتمع" iconColor="text-spiritual-green" bgColor="bg-spiritual-green/10" hoverBg="group-hover:bg-spiritual-green/5" hoverBorder="group-hover:border-spiritual-green/30" />
            <NavButton to="/courses" icon={GraduationCap} label="المسارات" iconColor="text-accent" bgColor="bg-accent/10" hoverBg="group-hover:bg-accent/5" hoverBorder="group-hover:border-accent/30" />
            <NavButton to="/workshops" icon={Video} label="الورش" iconColor="text-accent" bgColor="bg-accent/10" hoverBg="group-hover:bg-accent/5" hoverBorder="group-hover:border-accent/30" />
            <NavButton to="/rooms" icon={Headphones} label="الغرف" iconColor="text-primary" bgColor="bg-primary/10" hoverBg="group-hover:bg-primary/5" hoverBorder="group-hover:border-primary/30" />
            <NavButton to="/sudan-awareness" icon={Heart} label="الوعي السوداني" iconColor="text-destructive" bgColor="bg-destructive/10" hoverBg="group-hover:bg-destructive/5" hoverBorder="group-hover:border-destructive/30" />
            <NavButton to="/arab-awareness" icon={Globe} label="الوعي العربي" iconColor="text-accent" bgColor="bg-accent/10" hoverBg="group-hover:bg-accent/5" hoverBorder="group-hover:border-accent/30" />
            <NavButton to="/islamic-awareness" icon={Sparkles} label="الوعي الإسلامي" iconColor="text-primary" bgColor="bg-primary/10" hoverBg="group-hover:bg-primary/5" hoverBorder="group-hover:border-primary/30" />
          </div>
        </section>

        <UpcomingWorkshopsAnnouncement />

        {!authLoading && !isSubscribed && (
          <section className="sanctuary-card text-center space-y-4">
            <div className="relative z-10">
              {!user ? (
                <>
                  <h3 className="font-display font-semibold text-foreground">انضم إلى المدرسة الترتيلية</h3>
                  <p className="text-sm text-muted-foreground">سجّل الآن وابدأ رحلتك في تعلّم اللسان العربي المبين</p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild><Link to="/auth">تسجيل الدخول</Link></Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-2"><Crown className="h-8 w-8 text-accent" /></div>
                  <h3 className="font-display font-semibold text-foreground">اشترك واحصل على المميزات كاملة</h3>
                  <p className="text-sm text-muted-foreground">خصم 25% على جميع الخدمات + وصول غير محدود لمساعد التدبر</p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild><Link to="/subscription">الاشتراك الشهري - $29</Link></Button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
