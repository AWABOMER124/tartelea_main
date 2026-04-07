import { Check, Percent, BookOpen, Users, MessageSquare, Sparkles } from "lucide-react";
import { SUBSCRIPTION_DISCOUNT } from "@/hooks/useSubscription";

const discountPercent = Math.round(SUBSCRIPTION_DISCOUNT * 100);

export const benefits = [
  { icon: Percent, text: `خصم ${discountPercent}% على جميع الدورات` },
  { icon: BookOpen, text: `خصم ${discountPercent}% على الورش والمحاضرات` },
  { icon: Users, text: `خصم ${discountPercent}% على الغرف (Rooms)` },
  { icon: MessageSquare, text: "الوصول الكامل لشات بوت التدبر" },
  { icon: Sparkles, text: "محتوى حصري للمشتركين" },
];

export const SubscriptionBenefitsList = ({ showCheck = false }: { showCheck?: boolean }) => (
  <div className="space-y-2">
    {benefits.map((benefit, index) => {
      const Icon = showCheck ? Check : benefit.icon;
      return (
        <div key={index} className="flex items-center gap-2 text-sm">
          <Icon className={`h-4 w-4 ${showCheck ? "text-emerald-500" : "text-primary"}`} />
          <span>{benefit.text}</span>
        </div>
      );
    })}
  </div>
);
