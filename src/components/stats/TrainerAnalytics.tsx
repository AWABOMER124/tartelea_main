import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Star, BarChart3, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrainerAnalyticsProps {
  trainerId: string;
}

interface SubscriptionPoint {
  date: string;
  count: number;
}

interface RatingPoint {
  date: string;
  avgRating: number;
  count: number;
}

interface CourseStat {
  name: string;
  subscribers: number;
  rating: number;
}

interface RatingDistribution {
  name: string;
  value: number;
  stars: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 76%, 36%)",
  "hsl(280, 65%, 60%)",
  "hsl(30, 90%, 55%)",
  "hsl(200, 80%, 50%)",
];

const PIE_COLORS = [
  "hsl(0, 70%, 55%)",
  "hsl(30, 90%, 55%)",
  "hsl(45, 90%, 50%)",
  "hsl(142, 76%, 36%)",
  "hsl(var(--primary))",
];

const TrainerAnalytics = ({ trainerId }: TrainerAnalyticsProps) => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionPoint[]>([]);
  const [ratingData, setRatingData] = useState<RatingPoint[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, [trainerId]);

  const fetchAnalytics = async () => {
    setLoading(true);

    const { data: courses } = await supabase
      .from("trainer_courses")
      .select("id, title")
      .eq("trainer_id", trainerId)
      .eq("is_approved", true);

    if (!courses || courses.length === 0) {
      setLoading(false);
      return;
    }

    const courseIds = courses.map((c) => c.id);

    const [subsRes, ratingsRes] = await Promise.all([
      supabase
        .from("course_subscriptions")
        .select("course_id, subscribed_at")
        .in("course_id", courseIds)
        .order("subscribed_at", { ascending: true }),
      supabase
        .from("course_ratings")
        .select("course_id, rating, created_at")
        .in("course_id", courseIds)
        .order("created_at", { ascending: true }),
    ]);

    const subs = subsRes.data;
    const ratings = ratingsRes.data;

    setTotalSubscribers(subs?.length || 0);
    setTotalRatings(ratings?.length || 0);

    // Subscription growth
    if (subs && subs.length > 0) {
      const grouped: Record<string, number> = {};
      subs.forEach((s) => {
        const date = new Date(s.subscribed_at || "").toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
        grouped[date] = (grouped[date] || 0) + 1;
      });
      let cumulative = 0;
      setSubscriptionData(
        Object.entries(grouped).map(([date, count]) => {
          cumulative += count;
          return { date, count: cumulative };
        })
      );
    }

    // Ratings over time
    if (ratings && ratings.length > 0) {
      const grouped: Record<string, { total: number; count: number }> = {};
      ratings.forEach((r) => {
        const date = new Date(r.created_at || "").toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
        if (!grouped[date]) grouped[date] = { total: 0, count: 0 };
        grouped[date].total += r.rating;
        grouped[date].count += 1;
      });
      setRatingData(
        Object.entries(grouped).map(([date, { total, count }]) => ({
          date,
          avgRating: Math.round((total / count) * 10) / 10,
          count,
        }))
      );

      // Rating distribution (1-5 stars)
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r) => {
        dist[r.rating] = (dist[r.rating] || 0) + 1;
      });
      setRatingDistribution(
        [1, 2, 3, 4, 5].map((stars) => ({
          name: `${stars} ★`,
          value: dist[stars],
          stars,
        }))
      );

      const totalR = ratings.reduce((s, r) => s + r.rating, 0);
      setAvgRating(Math.round((totalR / ratings.length) * 10) / 10);
    }

    // Per-course stats
    const courseStatsArr: CourseStat[] = courses.map((course) => {
      const subCount = subs?.filter((s) => s.course_id === course.id).length || 0;
      const courseRatings = ratings?.filter((r) => r.course_id === course.id) || [];
      const avg =
        courseRatings.length > 0
          ? Math.round((courseRatings.reduce((s, r) => s + r.rating, 0) / courseRatings.length) * 10) / 10
          : 0;
      return {
        name: course.title.length > 20 ? course.title.substring(0, 20) + "..." : course.title,
        subscribers: subCount,
        rating: avg,
      };
    });
    setCourseStats(courseStatsArr);
    setLoading(false);
  };

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setExporting(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Trainer Analytics Report", pdfWidth / 2, 15, { align: "center" });
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }), pdfWidth / 2, 22, { align: "center" });

      // Summary line
      pdf.setFontSize(11);
      pdf.text(
        `Total Subscribers: ${totalSubscribers} | Avg Rating: ${avgRating}/5 | Total Ratings: ${totalRatings}`,
        pdfWidth / 2,
        30,
        { align: "center" }
      );

      // Add charts image
      if (pdfHeight > pdf.internal.pageSize.getHeight() - 40) {
        // Multi-page
        let remainingHeight = pdfHeight;
        let position = 35;
        let srcY = 0;
        const pageHeight = pdf.internal.pageSize.getHeight() - 40;
        const ratio = canvas.width / pdfWidth;

        while (remainingHeight > 0) {
          const sliceHeight = Math.min(pageHeight, remainingHeight);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight * ratio;
          const ctx = sliceCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeight * ratio, 0, 0, canvas.width, sliceHeight * ratio);
            const sliceData = sliceCanvas.toDataURL("image/png");
            pdf.addImage(sliceData, "PNG", 0, position, pdfWidth, sliceHeight);
          }
          remainingHeight -= sliceHeight;
          srcY += sliceHeight * ratio;
          if (remainingHeight > 0) {
            pdf.addPage();
            position = 10;
          }
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, 35, pdfWidth, pdfHeight);
      }

      pdf.save("trainer-analytics-report.pdf");
      toast({ title: "تم التصدير", description: "تم تحميل التقرير بنجاح" });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({ title: "خطأ", description: "فشل تصدير التقرير", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [totalSubscribers, avgRating, totalRatings, toast]);

  const subscriberChartConfig = useMemo(() => ({ count: { label: "المشتركون", color: "hsl(var(--primary))" } }), []);
  const ratingChartConfig = useMemo(() => ({
    avgRating: { label: "متوسط التقييم", color: "hsl(var(--accent))" },
    count: { label: "عدد التقييمات", color: "hsl(var(--primary))" },
  }), []);
  const courseChartConfig = useMemo(() => ({ subscribers: { label: "المشتركون", color: "hsl(var(--primary))" } }), []);
  const pieChartConfig = useMemo(() => ({
    value: { label: "عدد التقييمات" },
    "1": { label: "1 نجمة", color: PIE_COLORS[0] },
    "2": { label: "2 نجمة", color: PIE_COLORS[1] },
    "3": { label: "3 نجوم", color: PIE_COLORS[2] },
    "4": { label: "4 نجوم", color: PIE_COLORS[3] },
    "5": { label: "5 نجوم", color: PIE_COLORS[4] },
  }), []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const hasData = subscriptionData.length > 0 || ratingData.length > 0 || courseStats.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">لا توجد بيانات كافية لعرض التحليلات</p>
          <p className="text-sm text-muted-foreground mt-1">ستظهر الرسوم البيانية عند اشتراك الطلاب في دوراتك</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          التحليلات المتقدمة
        </h2>
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-2">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          تصدير PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{totalSubscribers}</p>
            <p className="text-xs text-muted-foreground">إجمالي المشتركين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Star className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{avgRating}</p>
            <p className="text-xs text-muted-foreground">متوسط التقييم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{totalRatings}</p>
            <p className="text-xs text-muted-foreground">إجمالي التقييمات</p>
          </CardContent>
        </Card>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Subscriber Growth Chart */}
        {subscriptionData.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm text-foreground">نمو المشتركين عبر الزمن</h3>
              </div>
              <ChartContainer config={subscriberChartConfig} className="h-64 w-full">
                <AreaChart data={subscriptionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#subscriberGradient)" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Ratings Over Time */}
        {ratingData.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 text-accent" />
                <h3 className="font-medium text-sm text-foreground">التقييمات عبر الزمن</h3>
              </div>
              <ChartContainer config={ratingChartConfig} className="h-64 w-full">
                <BarChart data={ratingData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} className="text-xs" tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="avgRating" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Rating Distribution Pie Chart */}
        {ratingDistribution.length > 0 && ratingDistribution.some((d) => d.value > 0) && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 text-accent" />
                <h3 className="font-medium text-sm text-foreground">توزيع التقييمات</h3>
              </div>
              <div className="flex items-center gap-4">
                <ChartContainer config={pieChartConfig} className="h-56 flex-1">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={ratingDistribution.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {ratingDistribution
                        .filter((d) => d.value > 0)
                        .map((entry) => (
                          <Cell key={entry.stars} fill={PIE_COLORS[entry.stars - 1]} />
                        ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2 min-w-[100px]">
                  {ratingDistribution.map((d) => (
                    <div key={d.stars} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[d.stars - 1] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-medium text-foreground mr-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Per-Course Subscribers */}
        {courseStats.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm text-foreground">المشتركون حسب الدورة</h3>
              </div>
              <ChartContainer config={courseChartConfig} className="h-64 w-full">
                <BarChart data={courseStats} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={75} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="subscribers" radius={[0, 4, 4, 0]}>
                    {courseStats.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrainerAnalytics;
