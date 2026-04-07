import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GraduationCap, Sparkles } from "lucide-react";

const steps = [
  {
    icon: BookOpen,
    title: "المكتبة الشاملة",
    description: "استكشف مقالات وفيديوهات ومحتوى صوتي في علوم القرآن والوعي",
  },
  {
    icon: GraduationCap,
    title: "الدورات التدريبية",
    description: "تعلّم مع مدربين متخصصين واحصل على شهادات معتمدة",
  },
  {
    icon: Users,
    title: "المجتمع التفاعلي",
    description: "شارك أفكارك وتفاعل مع أعضاء المجتمع في نقاشات هادفة",
  },
  {
    icon: Sparkles,
    title: "مساعد التدبر الذكي",
    description: "استفد من مساعد الذكاء الاصطناعي المتخصص في تدبر القرآن",
  },
];

const OnboardingDialog = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_completed");
    if (!seen) setOpen(true);
  }, []);

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setOpen(false);
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleComplete(); }}>
      <DialogContent className="max-w-sm text-center p-6 gap-6" dir="rtl" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{current.title}</DialogTitle>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-fade-in">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              السابق
            </Button>
          )}
          <Button
            onClick={isLast ? handleComplete : () => setStep(step + 1)}
            className="flex-1"
          >
            {isLast ? "ابدأ الآن!" : "التالي"}
          </Button>
        </div>

        <button
          onClick={handleComplete}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          تخطي
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
