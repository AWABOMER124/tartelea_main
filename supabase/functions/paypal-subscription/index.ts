import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_API_URL = "https://api-m.paypal.com"; // Use sandbox for testing: https://api-m.sandbox.paypal.com

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    const PAYPAL_SECRET_KEY = Deno.env.get("PAYPAL_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
      throw new Error("PayPal credentials not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid user token");
    }

    const userId = userData.user.id;
    const { action, subscriptionId } = await req.json();

    // Get PayPal access token
    const getAccessToken = async () => {
      const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`);
      const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        throw new Error("Failed to get PayPal access token");
      }

      const data = await response.json();
      return data.access_token;
    };

    if (action === "verify") {
      // Verify subscription status with PayPal
      const accessToken = await getAccessToken();
      
      const response = await fetch(
        `${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify subscription");
      }

      const subscriptionData = await response.json();
      const isActive = subscriptionData.status === "ACTIVE";

      if (isActive) {
        // Calculate expiration (1 month from now)
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Upsert subscription in database
        const { error: upsertError } = await supabase
          .from("monthly_subscriptions")
          .upsert({
            user_id: userId,
            paypal_subscription_id: subscriptionId,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (upsertError) {
          console.error("Upsert error:", upsertError);
          throw new Error("Failed to save subscription");
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          active: isActive,
          status: subscriptionData.status 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check") {
      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from("monthly_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      const isActive = subscription && new Date(subscription.expires_at) > new Date();

      return new Response(
        JSON.stringify({ 
          success: true, 
          hasSubscription: isActive,
          subscription 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("PayPal subscription error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
