import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Book, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", full_name: "" });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "مرحباً بك", description: "تم تسجيل الدخول بنجاح" });
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signupData.full_name },
      },
    });
    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
    } else {
      setSignupEmail(signupData.email);
      setSignupSuccess(true);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال البريد الإلكتروني", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم الإرسال", description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" });
      setShowForgotPassword(false);
    }
    setLoading(false);
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
                  <h2 className="text-lg font-display font-bold text-foreground">تم التسجيل بنجاح!</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    تم إرسال رابط التفعيل إلى بريدك الإلكتروني
                  </p>
                  <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-lg p-3 mt-3">
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground break-all">{signupEmail}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    يرجى فتح بريدك الإلكتروني والضغط على رابط التفعيل لإكمال التسجيل.
                    <br />
                    تحقق من مجلد الرسائل غير المرغوب فيها (Spam) إذا لم تجد الرسالة.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => { setSignupSuccess(false); setSignupEmail(""); }}>
                  العودة لتسجيل الدخول
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" className="w-full gap-3 mb-4" onClick={handleGoogleSignIn} disabled={googleLoading}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {googleLoading ? "جاري التحميل..." : "التسجيل باستخدام Google"}
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">أو</span>
                </div>

                {showForgotPassword ? (
                  <div className="space-y-4">
                    <h2 className="font-display font-semibold text-foreground text-center">استعادة كلمة المرور</h2>
                    <p className="text-sm text-muted-foreground text-center">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">البريد الإلكتروني</Label>
                        <Input id="forgot-email" type="email" placeholder="example@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
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
                          <Input id="login-email" type="email" placeholder="example@email.com" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">كلمة المرور</Label>
                            <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowForgotPassword(true)}>
                              نسيت كلمة المرور؟
                            </button>
                          </div>
                          <Input id="login-password" type="password" placeholder="••••••••" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} required />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "جاري الدخول..." : "تسجيل الدخول"}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">الاسم الكامل</Label>
                          <Input id="signup-name" type="text" placeholder="أدخل اسمك الكامل" value={signupData.full_name} onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                          <Input id="signup-email" type="email" placeholder="example@email.com" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">كلمة المرور</Label>
                          <Input id="signup-password" type="password" placeholder="••••••••" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} required minLength={6} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "جاري التسجيل..." : "إنشاء حساب"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
