import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Radio, Route, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Route,
    title: "ابدأ من مسار واضح",
    description: "تدرّج في رحلتك من التخلية إلى التحلية ثم التجلّي، بدل التنقل العشوائي بين المواد.",
  },
  {
    icon: BookOpen,
    title: "تعلّم بالطريقة المناسبة لك",
    description: "اختر من المسارات والمكتبة والورش والتسجيلات، وارجع لما تحتاجه وقتما شئت.",
  },
  {
    icon: Radio,
    title: "شارك في المجالس المباشرة",
    description: "تابع اللقاءات القادمة وادخل المجالس الصوتية والورش عندما تبدأ.",
  },
  {
    icon: Sparkles,
    title: "اسأل مساعد التدبر عند الحاجة",
    description: "استخدم المساعد كأداة مساندة أثناء الرحلة، بدون أن يزاحم المحتوى الأساسي.",
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
      <DialogContent className="max-w-sm gap-6 p-6 text-center" dir="rtl" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{current.title}</DialogTitle>
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
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
            <Button variant="outline" onClick={() => setStep(step - 1)} className="min-h-11 flex-1">
              السابق
            </Button>
          )}
          <Button
            onClick={isLast ? handleComplete : () => setStep(step + 1)}
            className="flex-1"
          >
            {isLast ? "ابدأ رحلتي" : "التالي"}
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
