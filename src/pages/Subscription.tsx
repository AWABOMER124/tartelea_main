import AppLayout from "@/components/layout/AppLayout";
import SubscriptionCard from "@/components/subscription/SubscriptionCard";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  BookOpen,
  Users,
  MessageSquare,
  Percent,
  Gift,
  CheckCircle,
  Star,
  Shield,
  Zap,
} from "lucide-react";

const Subscription = () => {
  const { discountPercent: backendDiscountPercent } = useSubscription();
  const discountPercent = Math.round(backendDiscountPercent * 100);

  const features = [
    {
      icon: BookOpen,
      title: "خصم على الدورات",
      description: `احصل على خصم ${discountPercent}% على جميع الدورات التدريبية المدفوعة`,
    },
    {
      icon: Users,
      title: "خصم على الورش والمحاضرات",
      description: `تخفيض ${discountPercent}% على جميع الورش والمحاضرات الحصرية`,
    },
    {
      icon: Gift,
      title: "خصم على الغرف",
      description: `استمتع بخصم ${discountPercent}% على جميع غرف النقاش والتعلم`,
    },
    {
      icon: MessageSquare,
      title: "مساعد التدبر بلا حدود",
      description: "وصول غير محدود لمساعد الذكاء الاصطناعي المتخصص في التدبر",
    },
  ];

  const testimonials = [
    { name: "أحمد م.", text: "اشتراكي في المنصة غيّر تجربتي في التدبر تماماً", rating: 5 },
    { name: "فاطمة ع.", text: "المحتوى الحصري والورش المباشرة تستحق كل ريال", rating: 5 },
    { name: "محمد ك.", text: "مساعد التدبر وحده يستحق الاشتراك", rating: 5 },
  ];

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              اشترك في المدرسة الترتيلية
            </h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              انضم إلى مجتمع المتعلمين واستمتع بمحتوى متميز وخصومات على جميع الخدمات
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
            <Shield className="h-3.5 w-3.5" />
            إلغاء في أي وقت
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
            <CheckCircle className="h-3.5 w-3.5" />
            دعم متواصل
          </Badge>
        </div>

        {/* Subscription Card */}
        <SubscriptionCard />

        {/* What You Get - Checklist */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            ماذا ستحصل عليه؟
          </h2>
          
          <div className="grid gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            ماذا يقول المشتركون؟
          </h2>
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex gap-1 mb-2">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground">"{t.text}"</p>
                  <p className="text-xs text-muted-foreground mt-2">— {t.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">أسئلة شائعة</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-foreground">هل يمكنني الإلغاء في أي وقت؟</p>
                <p className="text-muted-foreground text-xs mt-0.5">نعم، يمكنك إلغاء اشتراكك من خلال حسابك في PayPal بأي وقت.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">هل الخصم يشمل كل المحتوى؟</p>
                <p className="text-muted-foreground text-xs mt-0.5">نعم، خصم {discountPercent}% يشمل جميع الدورات والورش والغرف المدفوعة.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">كم عدد رسائل مساعد التدبر؟</p>
                <p className="text-muted-foreground text-xs mt-0.5">للمشتركين: غير محدود. لغير المشتركين: 20 رسالة يومياً.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Subscription;
