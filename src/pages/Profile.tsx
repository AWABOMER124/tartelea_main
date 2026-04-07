import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserCertificates from "@/components/certificates/UserCertificates";
import LearningStats from "@/components/stats/LearningStats";
import SubscriptionCard from "@/components/subscription/SubscriptionCard";
import { User, LogOut, Settings, Shield, GraduationCap, Calendar } from "lucide-react";

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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, country, avatar_url, bio")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setFormData({ full_name: data.full_name || "", country: data.country || "" });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, authLoading]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: formData.full_name, country: formData.country })
      .eq("id", user.id);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث الملف الشخصي", variant: "destructive" });
    } else {
      toast({ title: "تم بنجاح", description: "تم تحديث الملف الشخصي" });
    }
    setUpdating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-primary">
              {formData.full_name?.charAt(0) || user.email?.charAt(0) || "م"}
            </span>
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">{formData.full_name || "مستخدم جديد"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <LearningStats userId={user.id} />
        <SubscriptionCard />
        <UserCertificates userId={user.id} />

        <div className="content-card space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">تعديل الملف الشخصي</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل</Label>
              <Input id="full_name" placeholder="أدخل اسمك الكامل" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">البلد</Label>
              <Input id="country" placeholder="أدخل بلدك" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
            </div>
            <Button onClick={handleUpdateProfile} disabled={updating} className="w-full">
              {updating ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Button asChild variant="outline" className="w-full gap-2">
            <Link to="/bookings"><Calendar className="h-4 w-4" />حجوزاتي</Link>
          </Button>
          {isTrainer && (
            <Button asChild variant="secondary" className="w-full gap-2">
              <Link to="/trainer"><GraduationCap className="h-4 w-4" />لوحة المدرب</Link>
            </Button>
          )}
          {isModerator && (
            <Button asChild variant="secondary" className="w-full gap-2">
              <Link to="/admin"><Shield className="h-4 w-4" />لوحة التحكم</Link>
            </Button>
          )}
        </div>

        <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
