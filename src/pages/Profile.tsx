import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { logoutEverywhere } from "@/lib/webAuth";
import { getBackendProfile, updateBackendProfile } from "@/lib/backendProfile";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserCertificates from "@/components/certificates/UserCertificates";
import LearningStats from "@/components/stats/LearningStats";
import SubscriptionCard from "@/components/subscription/SubscriptionCard";
import { User, LogOut, Settings, Shield, GraduationCap, Calendar, BookOpen, Award, CreditCard } from "lucide-react";

interface ProfileData {
  full_name: string | null;
  country: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isModerator, isTrainer } = useUserRole();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", country: "" });
  const [activeSection, setActiveSection] = useState<"journey" | "profile" | "account">("journey");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const data = await getBackendProfile(user.id);
        setProfile(data);
        setFormData({ full_name: data.full_name || "", country: data.country || "" });
      } catch {
        toast({
          title: "تعذر تحميل الملف الشخصي",
          description: "حاول تحديث الصفحة أو تسجيل الدخول من جديد.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [user, authLoading]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const updated = await updateBackendProfile(user.id, {
        full_name: formData.full_name.trim(),
        country: formData.country.trim(),
      });
      setProfile(updated);
      setFormData({
        full_name: updated.full_name || "",
        country: updated.country || "",
      });
      toast({ title: "تم بنجاح", description: "تم تحديث الملف الشخصي" });
    } catch {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الملف الشخصي",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logoutEverywhere();
    navigate("/auth");
  };

  if (loading || authLoading) {
    return (
      <AppLayout>
        <div className="px-4 py-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto" />
            <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">غير مسجل الدخول</h1>
          <p className="text-muted-foreground text-sm">قم بتسجيل الدخول للوصول إلى ملفك الشخصي</p>
          <Button onClick={() => navigate("/auth")}>تسجيل الدخول</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-right">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-2xl font-bold text-primary">
              {formData.full_name?.charAt(0) || user.email?.charAt(0) || "م"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-spiritual-green">حسابي</p>
            <h1 className="text-2xl font-bold text-foreground">{formData.full_name || "مستخدم جديد"}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </header>

        <nav aria-label="أقسام الحساب" className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          {[
            { id: "journey" as const, label: "رحلتي", icon: BookOpen },
            { id: "profile" as const, label: "ملفي", icon: User },
            { id: "account" as const, label: "حسابي", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              aria-pressed={activeSection === id}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${activeSection === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {activeSection === "journey" && (
          <section className="space-y-5" aria-label="رحلتي التعليمية">
            <div>
              <p className="text-sm font-semibold text-spiritual-green">تقدّمك في المدرسة</p>
              <h2 className="mt-1 text-xl font-bold">رحلتي التعليمية</h2>
            </div>
            <LearningStats userId={user.id} />
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                <h3 className="font-bold">الشهادات</h3>
              </div>
              <UserCertificates userId={user.id} />
            </div>
            <Button asChild variant="outline" className="min-h-11 w-full gap-2">
              <Link to="/bookings"><Calendar className="h-4 w-4" />حجوزاتي</Link>
            </Button>
          </section>
        )}

        {activeSection === "profile" && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="profile-edit-title">
            <div className="mb-5 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <h2 id="profile-edit-title" className="font-bold text-foreground">بياناتي</h2>
                <p className="mt-1 text-sm text-muted-foreground">حدّث المعلومات الأساسية الظاهرة في ملفك.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input id="full_name" placeholder="أدخل اسمك الكامل" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">البلد</Label>
                <Input id="country" placeholder="أدخل بلدك" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
              </div>
              <Button onClick={handleUpdateProfile} disabled={updating} className="min-h-11 w-full sm:w-auto">
                {updating ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </section>
        )}

        {activeSection === "account" && (
          <section className="space-y-4" aria-label="إعدادات الحساب">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                <h2 className="font-bold">العضوية</h2>
              </div>
              <SubscriptionCard />
            </div>

            {(isTrainer || isModerator) && (
              <div className="grid gap-2 sm:grid-cols-2">
                {isTrainer && (
                  <Button asChild variant="secondary" className="min-h-11 gap-2">
                    <Link to="/trainer"><GraduationCap className="h-4 w-4" />لوحة المدرب</Link>
                  </Button>
                )}
                {isModerator && (
                  <Button asChild variant="secondary" className="min-h-11 gap-2">
                    <Link to="/admin"><Shield className="h-4 w-4" />لوحة التحكم</Link>
                  </Button>
                )}
              </div>
            )}

            <Button variant="outline" onClick={handleLogout} className="min-h-11 w-full gap-2 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Profile;
