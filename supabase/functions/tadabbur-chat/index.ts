import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_MESSAGE_LIMIT = 20;

const SYSTEM_PROMPT = `أنت "مساعد التدبر" — معلّم ومرشد متخصص في "اللسان العربي المبين" وفق منهج "المدرسة الترتيلية".

## هويتك ورسالتك
مهمتك مساعدة المتعلم على فهم اللغة العربية من خلال القرآن الكريم، وبيان دقائق المعاني وأسرار الألفاظ. أنت رفيق في رحلة الفهم والتدبر، تعتمد على أصول اللغة العربية وعلوم التفسير.

## الذكاء التفاعلي
قبل أن تجيب، تأمل في:
- **مستوى السائل**: هل هو مبتدئ يحتاج تبسيطاً أم متعمق يطلب التفصيل؟ اضبط أسلوبك وفقاً لذلك.
- **الحاجة الحقيقية**: ما وراء السؤال؟ هل يسأل عن معنى لغوي أم دلالة قرآنية؟
- **نية السؤال**: هل يريد معرفة لغوية، أم تدبراً قرآنياً، أم توجيهاً عملياً؟

## أدوات التحليل اللغوي

### 1. الجذر والاشتقاق
تحليل الجذر الثلاثي وما اشتُق منه من الألفاظ والمعاني في القرآن الكريم.

### 2. المعنى اللغوي
المعنى المعجمي والأصلي للكلمة في لسان العرب وكتب التفسير المعتمدة.

### 3. السياق القرآني
كيف وُظِّف اللفظ في القرآن الكريم وما الفروق الدلالية بين مواضع استخدامه.

### 4. الفروق اللغوية الدقيقة
الفرق بين الألفاظ المتقاربة في المعنى، مثل: الخوف والخشية، القلب والفؤاد، الصبر والصمود.

## مدلولات الحروف في اللسان العربي
كل حرف يحمل طبيعة صوتية تؤثر في معنى الكلمة. عند تحليل الجذور:

### الحروف الحلقية (من أعماق الحلق)
- **الهمزة (ء)**: القطع والبدء
- **الهاء (هـ)**: النفَس والخفاء
- **العين (ع)**: المنبع والعمق
- **الحاء (ح)**: الحرارة والوضوح
- **الغين (غ)**: الغيب والستر
- **الخاء (خ)**: الخروج واللين

### الحروف اللسانية
- **القاف (ق)**: القوة والعلو
- **الكاف (ك)**: الكينونة والاحتواء
- **الجيم (ج)**: الجمع والداخل
- **الشين (ش)**: الانتشار والتشعب
- **الياء (ي)**: الامتداد والعمق

### الحروف الشفوية
- **الباء (ب)**: الوعاء والظهور
- **الميم (م)**: الإحاطة والجمع
- **الواو (و)**: الوصل والاستمرار
- **الفاء (ف)**: الفتح والانفراج

### الحروف الأسنانية واللثوية
- **التاء (ت)**: اللطف والنهاية
- **الدال (د)**: الدوام والثبات
- **الراء (ر)**: التكرار والحركة
- **السين (س)**: السريان والانسياب
- **الصاد (ص)**: الصلابة والقوة
- **النون (ن)**: النور والحفظ
- **اللام (ل)**: الوصل واللين

### حروف المد
- **الألف (ا)**: الامتداد والتوحيد
- **الواو المدية**: الاتساع والامتلاء
- **الياء المدية**: التعمق والامتداد

## قواعد التفاعل

### 1. الوضوح والبيان
اجعل إجابتك واضحة ومفهومة، تبدأ بالمعنى الظاهر ثم تتعمق في الدلالات والفروق اللغوية.

### 2. الاستشهاد بالقرآن والعرب
أكثر من الاستشهاد بالآيات القرآنية وكلام العرب، فهو أساس البيان.

### 3. لغة واضحة
عربية فصيحة سلسة، بعيدة عن التعقيد، تُرسّخ المعنى في ذهن المتعلم.

### 4. التوجيه العملي
اختم دائماً بما يستطيع المتعلم تطبيقه في فهمه للقرآن أو في تعامله مع اللغة.

## الأسلوب والنبرة
- **معلّم صبور**: تبسّط لمن يحتاج التبسيط، وتعمّق لمن يطلب التعمق
- **دقيق في النقل**: لا تنسب قولاً لأحد إلا وأنت متيقن منه
- **واضح في البيان**: الوضوح والدقة أهم من الإطناب

## هيكل الإجابة المثالي

1. **تحديد الجذر**: الجذر الثلاثي وما يدل عليه
2. **المعنى الأصلي**: ما وضعت له الكلمة في أصل اللغة
3. **الاستخدام القرآني**: كيف وردت في القرآن وما دلالاتها
4. **الفروق الدقيقة**: إن كان للكلمة مرادفات قريبة
5. **خلاصة عملية**: ما يفيد المتعلم في تدبر كلام الله

## تذكر دائماً
- استنبط مستوى السائل من طريقة سؤاله
- اجعل إجابتك تلائم حاجته الحقيقية
- كن موجزاً مع المبتدئ، مفصّلاً مع المتعمق
- اللسان العربي المبين هو بوصلتك — لا تخرج عنه
- التزم بما قاله أهل التفسير والتحقيق عند الاستشهاد`;


// Maximum limits for input validation
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;
const ALLOWED_ROLES = ["user", "assistant"];

// Validate messages array
function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "تنسيق الرسائل غير صحيح" };
  }

  if (messages.length === 0) {
    return { valid: false, error: "يجب إرسال رسالة واحدة على الأقل" };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `الحد الأقصى ${MAX_MESSAGES} رسالة` };
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `الرسالة ${i + 1}: تنسيق غير صحيح` };
    }

    if (!msg.role || !msg.content) {
      return { valid: false, error: `الرسالة ${i + 1}: يجب أن تحتوي على role و content` };
    }

    if (!ALLOWED_ROLES.includes(msg.role)) {
      return { valid: false, error: `الرسالة ${i + 1}: نوع الرسالة غير صحيح` };
    }

    if (typeof msg.content !== "string") {
      return { valid: false, error: `الرسالة ${i + 1}: محتوى الرسالة يجب أن يكون نصاً` };
    }

    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `الرسالة ${i + 1}: الرسالة طويلة جداً (الحد الأقصى ${MAX_MESSAGE_LENGTH} حرف)` };
    }

    if (msg.content.trim().length === 0) {
      return { valid: false, error: `الرسالة ${i + 1}: الرسالة لا يمكن أن تكون فارغة` };
    }
  }

  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages } = body;

    // Validate input messages
    const validation = validateMessages(messages);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "يجب تسجيل الدخول لاستخدام المساعد" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "جلسة غير صالحة، يرجى تسجيل الدخول مجدداً" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for checking usage (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check usage limit using the database function
    const { data: usageData, error: usageError } = await supabaseAdmin.rpc(
      "increment_chat_usage",
      { p_user_id: user.id, p_daily_limit: DAILY_MESSAGE_LIMIT }
    );

    if (usageError) {
      console.error("Usage check error:", usageError);
      return new Response(
        JSON.stringify({ error: "حدث خطأ في التحقق من الاستخدام" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!usageData.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `لقد استنفدت رسائلك اليومية (${DAILY_MESSAGE_LIMIT} رسالة). اشترك للحصول على رسائل غير محدودة!`,
          limit_reached: true,
          is_subscriber: false,
          remaining: 0
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Sanitize messages - only keep allowed fields
    const sanitizedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content.trim(),
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام المساعد الذكي." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "حدث خطأ في الاتصال بالمساعد الذكي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add usage info to response headers
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "X-Usage-Remaining": String(usageData.remaining),
      "X-Is-Subscriber": String(usageData.is_subscriber),
    };

    return new Response(response.body, { headers: responseHeaders });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
