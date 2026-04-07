import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield, AlertCircle, Users, Book, Scale } from "lucide-react";

const Terms = () => {
  const sections = [
    {
      icon: FileText,
      title: "مقدمة",
      content: `مرحباً بك في منصة تأهيل التعليمية. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بشروط الاستخدام التالية. يرجى قراءتها بعناية قبل استخدام خدماتنا.

هذه الشروط تنظم العلاقة بينك وبين منصة تأهيل وتحدد حقوقك ومسؤولياتك كمستخدم.`
    },
    {
      icon: Users,
      title: "التسجيل والحساب",
      content: `• يجب أن تكون قد بلغت السن القانونية في بلدك للتسجيل.
• يجب تقديم معلومات صحيحة ودقيقة عند التسجيل.
• أنت مسؤول عن الحفاظ على سرية بيانات حسابك.
• يحق للمنصة تعليق أو إنهاء حسابك في حال مخالفة الشروط.
• لا يجوز مشاركة حسابك مع أي شخص آخر.`
    },
    {
      icon: Book,
      title: "المحتوى التعليمي",
      content: `• جميع المحتويات التعليمية محمية بحقوق الملكية الفكرية.
• يُمنع نسخ أو توزيع أو بيع أي محتوى دون إذن كتابي.
• الورش والدورات متاحة للاستخدام الشخصي فقط.
• لا يجوز تسجيل البث المباشر أو مشاركته.
• المدربون مسؤولون عن محتوى دوراتهم وورشهم.`
    },
    {
      icon: Scale,
      title: "قواعد السلوك",
      content: `• يجب احترام جميع المستخدمين والمدربين.
• يُمنع نشر محتوى مسيء أو غير لائق.
• يُمنع التحرش أو التنمر بأي شكل من الأشكال.
• يجب الالتزام بآداب الحوار في المجتمع والتعليقات.
• يحق للمشرفين حذف أي محتوى مخالف دون إنذار.`
    },
    {
      icon: Shield,
      title: "الاشتراكات والدفع",
      content: `• الاشتراكات تجدد تلقائياً ما لم يتم إلغاؤها.
• لا تُسترد رسوم الاشتراك بعد بدء الفترة.
• أسعار الدورات المدفوعة غير قابلة للاسترداد بعد البدء.
• يحق للمنصة تعديل الأسعار مع إشعار مسبق.
• جميع المعاملات المالية مشفرة وآمنة.`
    },
    {
      icon: AlertCircle,
      title: "إخلاء المسؤولية",
      content: `• المحتوى التعليمي للأغراض التعليمية فقط.
• لا تتحمل المنصة مسؤولية أي قرارات تتخذها بناءً على المحتوى.
• نسعى لتوفير خدمة مستمرة لكن قد تحدث انقطاعات تقنية.
• الآراء المعبر عنها من المدربين لا تمثل بالضرورة رأي المنصة.
• يحق للمنصة تعديل هذه الشروط في أي وقت.`
    }
  ];

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            شروط الاستخدام
          </h1>
          <p className="text-muted-foreground">
            آخر تحديث: فبراير 2026
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="h-auto">
          <div className="space-y-4">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index} className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
          <p>
            باستخدامك للمنصة فإنك توافق على هذه الشروط.
          </p>
          <p className="mt-1">
            للاستفسارات: support@taaheel.app
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Terms;
