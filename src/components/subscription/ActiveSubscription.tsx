import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { SubscriptionBenefitsList } from "./SubscriptionBenefits";

interface ActiveSubscriptionProps {
  expiresAt: string;
}

const ActiveSubscription = ({ expiresAt }: ActiveSubscriptionProps) => (
  <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          الاشتراك الشهري
        </CardTitle>
        <Badge className="bg-primary text-primary-foreground">نشط</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">
        اشتراكك نشط حتى:{" "}
        <span className="font-semibold text-foreground">
          {new Date(expiresAt).toLocaleDateString("ar-SA")}
        </span>
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium">مميزاتك:</p>
        <SubscriptionBenefitsList showCheck />
      </div>
    </CardContent>
  </Card>
);

export default ActiveSubscription;
