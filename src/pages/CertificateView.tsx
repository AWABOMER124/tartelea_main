import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Calendar, User, BookOpen, ArrowRight, Share2 } from "lucide-react";
import { format, ar } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";

interface CertificateData {
  id: string;
  certificate_number: string;
  issued_at: string;
  user_name?: string;
  course_title?: string;
}

const CertificateView = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCertificate();
    }
  }, [id]);

  const fetchCertificate = async () => {
    const { data: certData } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!certData) {
      setLoading(false);
      return;
    }

    // Get user name
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", certData.user_id)
      .maybeSingle();

    // Get course title
    const { data: courseData } = await supabase
      .from("trainer_courses")
      .select("title")
      .eq("id", certData.course_id)
      .maybeSingle();

    setCertificate({
      ...certData,
      user_name: profileData?.full_name || "متدرب",
      course_title: courseData?.title || "دورة",
    });

    setLoading(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `شهادة إتمام - ${certificate?.course_title}`,
          text: `لقد أتممت دورة "${certificate?.course_title}" بنجاح`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "تم نسخ رابط الشهادة" });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!certificate) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center space-y-4">
          <Award className="h-16 w-16 mx-auto text-muted-foreground/50" />
          <h1 className="text-xl font-bold">الشهادة غير موجودة</h1>
          <Button asChild>
            <Link to="/">العودة للرئيسية</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2"
        >
          <Link to="/profile">
            <ArrowRight className="h-4 w-4" />
            العودة
          </Link>
        </Button>

        {/* Certificate Card */}
        <Card className="overflow-hidden border-2 border-primary/20">
          <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Award className="h-10 w-10 text-primary-foreground" />
              </div>
              
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  شهادة إتمام
                </h1>
                <p className="text-sm text-muted-foreground">
                  Certificate of Completion
                </p>
              </div>
            </div>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 my-6">
              <span className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/30" />
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/30" />
            </div>

            {/* Content */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">نشهد بأن</p>
              
              <h2 className="text-2xl font-display font-bold text-primary">
                {certificate.user_name}
              </h2>

              <p className="text-muted-foreground">
                قد أتم بنجاح دورة
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                {certificate.course_title}
              </h3>

              <div className="pt-4">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(certificate.issued_at), "d MMMM yyyy", {
                      locale: ar,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-primary/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>المدرسة الترتيلية</span>
                <span>{certificate.certificate_number}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleShare} className="flex-1 gap-2">
            <Share2 className="h-4 w-4" />
            مشاركة الشهادة
          </Button>
        </div>

        {/* Verification Notice */}
        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            <p>
              يمكن التحقق من صحة هذه الشهادة عبر رقم الشهادة:
            </p>
            <p className="font-mono text-foreground mt-1">
              {certificate.certificate_number}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CertificateView;
