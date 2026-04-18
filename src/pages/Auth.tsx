import { useState } from "react";
import { ArrowRight, Book, CheckCircle2, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  loginWithBackend,
  requestPasswordResetWithBackend,
  signupWithBackend,
  verifyEmailWithBackend,
} from "@/lib/webAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationState, setVerificationState] = useState<{
    email: string;
    password: string;
    devOtp?: string | null;
  } | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", full_name: "" });

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await loginWithBackend(loginData.email, loginData.password);
      toast({ title: "تم تسجيل الدخول", description: "تم فتح الجلسة بنجاح." });
      navigate("/");
    } catch (error) {
      toast({
        title: "تعذر تسجيل الدخول",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await signupWithBackend(signupData);

      if (result.session.accessToken && result.session.user) {
        toast({ title: "تم إنشاء الحساب", description: "تم تسجيل الدخول مباشرة." });
        navigate("/");
        return;
      }

      setSignupEmail(signupData.email);
      setSignupSuccess(true);
      setVerificationState({
        email: signupData.email,
        password: signupData.password,
        devOtp: result.payload.data?.devOtp ?? null,
      });
    } catch (error) {
      toast({
        title: "تعذر إنشاء الحساب",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!forgotEmail.trim()) {
      toast({
        title: "البريد مطلوب",
        description: "أدخل البريد الإلكتروني أولًا.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordResetWithBackend(forgotEmail);
      const devOtp = response.devOtp ?? response.data?.devOtp;

      toast({
        title: "تم إرسال الرمز",
        description: devOtp
          ? `رمز التطوير الحالي: ${devOtp}`
          : "تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني.",
      });
      setShowForgotPassword(false);
      navigate(`/reset-password?email=${encodeURIComponent(forgotEmail)}`);
    } catch (error) {
      toast({
        title: "تعذر الإرسال",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!verificationState?.email || !verificationCode.trim()) {
      toast({
        title: "رمز التحقق مطلوب",
        description: "أدخل رمز التحقق المرسل إلى بريدك.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await verifyEmailWithBackend(
        {
          email: verificationState.email,
          code: verificationCode.trim(),
        },
        verificationState.password,
      );

      toast({
        title: "تم التحقق",
        description: "تم تفعيل الحساب وفتح الجلسة بنجاح.",
      });

      setVerificationState(null);
      setVerificationCode("");
      navigate("/");
    } catch (error) {
      toast({
        title: "تعذر التحقق",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground">
          <ArrowRight className="h-5 w-5" />
          <span className="text-sm">العودة للرئيسية</span>
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Book className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">المدرسة الترتيلية</h1>
          </div>

          <div className="content-card p-6">
            {signupSuccess ? (
              <div className="space-y-6 text-center py-4">
                <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-display font-bold text-foreground">
                    {verificationState ? "تم إنشاء الحساب" : "تم التسجيل بنجاح"}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {verificationState
                      ? "أدخل رمز التحقق لإكمال تفعيل الحساب."
                      : "تم إرسال رسالة التفعيل إلى بريدك الإلكتروني."}
                  </p>
                  <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-lg p-3 mt-3">
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground break-all">{signupEmail}</span>
                  </div>
                  {verificationState ? (
                    <form onSubmit={handleVerifyEmail} className="space-y-4 text-right">
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">رمز التحقق</Label>
                        <Input
                          id="verification-code"
                          inputMode="numeric"
                          placeholder="أدخل 6 أرقام"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          required
                        />
                      </div>
                      {verificationState.devOtp ? (
                        <div className="text-xs rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-700">
                          رمز التطوير الحالي: {verificationState.devOtp}
                        </div>
                      ) : null}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "جار التحقق..." : "تأكيد الرمز"}
                      </Button>
                    </form>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-3">
                      تحقق من البريد الوارد أو مجلد الرسائل غير المرغوبة إذا لم تصل الرسالة.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSignupSuccess(false);
                    setSignupEmail("");
                    setVerificationCode("");
                    setVerificationState(null);
                  }}
                >
                  العودة لتسجيل الدخول
                </Button>
              </div>
            ) : showForgotPassword ? (
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-foreground text-center">استعادة كلمة المرور</h2>
                <p className="text-sm text-muted-foreground text-center">
                  أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة التعيين.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">البريد الإلكتروني</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="example@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "جار الإرسال..." : "إرسال الرمز"}
                  </Button>
                </form>
                <Button variant="ghost" className="w-full text-sm" onClick={() => setShowForgotPassword(false)}>
                  العودة لتسجيل الدخول
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="signup">حساب جديد</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">البريد الإلكتروني</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData((current) => ({ ...current, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">كلمة المرور</Label>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          نسيت كلمة المرور؟
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="********"
                        value={loginData.password}
                        onChange={(e) => setLoginData((current) => ({ ...current, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "جار تسجيل الدخول..." : "تسجيل الدخول"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">الاسم الكامل</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="اسمك الكامل"
                        value={signupData.full_name}
                        onChange={(e) => setSignupData((current) => ({ ...current, full_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="example@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData((current) => ({ ...current, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">كلمة المرور</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="********"
                        value={signupData.password}
                        onChange={(e) => setSignupData((current) => ({ ...current, password: e.target.value }))}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "جار إنشاء الحساب..." : "إنشاء الحساب"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
