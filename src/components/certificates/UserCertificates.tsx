import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, ExternalLink, Calendar } from "lucide-react";
import { format, ar } from "@/lib/date-utils";

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  course_id: string;
  course_title?: string;
}

interface UserCertificatesProps {
  userId: string | null;
}

const UserCertificates = ({ userId }: UserCertificatesProps) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchCertificates();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchCertificates = async () => {
    const { data: certsData } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });

    if (certsData && certsData.length > 0) {
      // Get course titles
      const courseIds = certsData.map((c) => c.course_id);
      const { data: coursesData } = await supabase
        .from("trainer_courses")
        .select("id, title")
        .in("id", courseIds);

      const coursesMap = new Map(
        coursesData?.map((c) => [c.id, c.title]) || []
      );

      setCertificates(
        certsData.map((cert) => ({
          ...cert,
          course_title: coursesMap.get(cert.course_id) || "دورة",
        }))
      );
    }

    setLoading(false);
  };

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (certificates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">شهاداتي ({certificates.length})</h3>
      </div>

      <div className="space-y-3">
        {certificates.map((cert) => (
          <Card key={cert.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-1">
                    {cert.course_title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {cert.certificate_number}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(cert.issued_at), "d MMMM yyyy", {
                        locale: ar,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to={`/certificate/${cert.id}`}>
                    <ExternalLink className="h-3 w-3 ml-1" />
                    عرض
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserCertificates;
