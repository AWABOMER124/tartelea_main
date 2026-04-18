import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ActiveSubscription from "./ActiveSubscription";
import PayPalButton from "./PayPalButton";
import { SubscriptionBenefitsList } from "./SubscriptionBenefits";

const SubscriptionCard = () => {
  const { toast } = useToast();
  const { hasSubscription, hasPremiumAccess, roleOverrides, subscription, loading, verifySubscription } = useSubscription();
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    init();
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => authSub.unsubscribe();
  }, []);

  const handlePayPalApprove = useCallback(async (subscriptionId: string) => {
    setProcessing(true);
    try {
      const success = await verifySubscription(subscriptionId);
      toast({
        title: success ? "تم بنجاح!" : "خطأ",
        description: success ? "تم تفعيل اشتراكك الشهري بنجاح" : "فشل تفعيل الاشتراك، يرجى المحاولة مرة أخرى",
        variant: success ? "default" : "destructive",
      });
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء معالجة الدفع", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }, [verifySubscription, toast]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (hasSubscription && subscription) {
    return <ActiveSubscription expiresAt={subscription.expires_at!} />;
  }

  if (hasPremiumAccess && (roleOverrides.admin || roleOverrides.trainer)) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-amber-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Premium Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your access is managed by the platform team, so you do not need a paid monthly subscription.
          </p>
          <SubscriptionBenefitsList showCheck />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            الاشتراك الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            سجل دخولك للاشتراك والحصول على المميزات
          </p>
          <Button asChild className="w-full">
            <a href="/auth">تسجيل الدخول</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          الاشتراك الشهري
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-foreground">$29</p>
          <p className="text-sm text-muted-foreground">شهرياً</p>
        </div>
        <SubscriptionBenefitsList />
        <PayPalButton onApprove={handlePayPalApprove} />
        {processing && (
          <p className="text-sm text-center text-muted-foreground">جاري معالجة الدفع...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
