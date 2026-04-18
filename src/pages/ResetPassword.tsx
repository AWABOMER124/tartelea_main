import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithBackend } from "@/lib/webAuth";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTargetEmail(params.get("email") || "");
  }, []);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "كلمتا المرور غير متطابقتين",
        description: "أعد إدخال كلمة المرور نفسها في الحقلين.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "كلمة المرور قصيرة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
        variant: "destructive",
      });
      return;
    }

    if (!otp.trim()) {
      toast({
        title: "رمز التعيين مطلوب",
        description: "أدخل رمز إعادة التعيين أولًا.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await resetPasswordWithBackend({
        otp: otp.trim(),
        newPassword: password,
      });

      toast({
        title: "تم تحديث كلمة المرور",
        description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "تعذر إعادة التعيين",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Book className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">تعيين كلمة مرور جديدة</h1>
        </div>

        <div className="content-card p-6">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">رمز إعادة التعيين</Label>
              <Input
                id="otp"
                inputMode="numeric"
                placeholder="أدخل الرمز المكون من 6 أرقام"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              {targetEmail ? (
                <p className="text-xs text-muted-foreground">الرمز المرسل إلى: {targetEmail}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جار الحفظ..." : "حفظ كلمة المرور"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              العودة لتسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
