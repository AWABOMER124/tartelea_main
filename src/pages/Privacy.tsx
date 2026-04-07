import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Eye, Database, Share2, Settings, Mail } from "lucide-react";

const Privacy = () => {
  const sections = [
    {
      icon: Eye,
      title: "المعلومات التي نجمعها",
      content: `نقوم بجمع المعلومات التالية لتقديم خدماتنا:

• معلومات الحساب: الاسم، البريد الإلكتروني، البلد.
• بيانات الاستخدام: الدورات المشترك بها، التقدم في التعلم.
• معلومات الجهاز: نوع المتصفح، نظام التشغيل، عنوان IP.
• ملفات تعريف الارتباط: لتحسين تجربة المستخدم.`
    },
    {
      icon: Database,
      title: "كيف نستخدم معلوماتك",
      content: `نستخدم المعلومات المجمعة للأغراض التالية:

• تقديم وتحسين خدماتنا التعليمية.
• تخصيص تجربة التعلم حسب اهتماماتك.
• إرسال إشعارات مهمة حول حسابك.
• تحليل استخدام المنصة لتطويرها.
• التواصل معك بشأن الورش والدورات الجديدة.`
    },
    {
      icon: Lock,
      title: "حماية بياناتك",
      content: `نتخذ إجراءات أمنية صارمة لحماية بياناتك:

• تشفير جميع البيانات أثناء النقل والتخزين.
• استخدام بروتوكولات HTTPS الآمنة.
• حماية كلمات المرور بتقنيات تشفير متقدمة.
• مراجعات أمنية دورية للنظام.
• تقييد الوصول للبيانات على الموظفين المخولين فقط.`
    },
    {
      icon: Share2,
      title: "مشاركة المعلومات",
      content: `لا نبيع معلوماتك الشخصية. قد نشاركها في الحالات التالية:

• مع مقدمي الخدمات الذين يساعدوننا في تشغيل المنصة.
• للامتثال للمتطلبات القانونية.
• لحماية حقوق المنصة والمستخدمين.
• مع موافقتك الصريحة.

يلتزم جميع الشركاء بسياسات خصوصية صارمة.`
    },
    {
      icon: Settings,
      title: "حقوقك",
      content: `لديك الحقوق التالية فيما يتعلق ببياناتك:

• الوصول: يمكنك طلب نسخة من بياناتك.
• التصحيح: يمكنك تحديث معلوماتك من الملف الشخصي.
• الحذف: يمكنك طلب حذف حسابك وبياناتك.
• الاعتراض: يمكنك الاعتراض على معالجة بياناتك لأغراض معينة.
• إلغاء الاشتراك: يمكنك إلغاء تلقي الرسائل التسويقية.`
    },
    {
      icon: Mail,
      title: "تواصل معنا",
      content: `إذا كان لديك أي استفسارات حول سياسة الخصوصية:

• البريد الإلكتروني: privacy@taaheel.app
• يمكنك أيضاً التواصل عبر صفحة الملف الشخصي.

نحن ملتزمون بالرد على استفساراتك خلال 48 ساعة عمل.`
    }
  ];

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            سياسة الخصوصية
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
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-accent" />
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
            نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.
          </p>
          <p className="mt-1">
            © 2026 منصة تأهيل. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Privacy;
