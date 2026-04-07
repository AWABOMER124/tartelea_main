import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const PAYPAL_PLAN_ID = "P-9WT17394MH841673WNGD5T5Q";

interface PayPalButtonProps {
  onApprove: (subscriptionId: string) => void;
}

const PayPalButton = ({ onApprove }: PayPalButtonProps) => {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const clientId =
      import.meta.env.VITE_PAYPAL_CLIENT_ID ||
      "AXDRH1i1nDBs8LqTA_MV6Vf2PgIpAecYhNFv5ySaWOgcba2qIj_Y5bWF8uIEez2-pJDGbWdhnV5dOnQS";

    const loadSdk = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if ((window as any).paypal) return resolve();
        const existing = document.querySelector('script[data-paypal-sdk="true"]');
        if (existing) existing.remove();
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
        script.async = true;
        script.setAttribute("data-paypal-sdk", "true");
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("PayPal SDK failed"));
        document.body.appendChild(script);
      });

    const render = () => {
      if (cancelled || !containerRef.current) return;
      const paypal = (window as any).paypal;
      if (!paypal) return;
      containerRef.current.innerHTML = "";
      paypal.Buttons({
        style: { shape: "rect", color: "gold", layout: "vertical", label: "subscribe" },
        createSubscription: (_: any, actions: any) => actions.subscription.create({ plan_id: PAYPAL_PLAN_ID }),
        onApprove: (data: any) => onApprove(data.subscriptionID),
        onError: (err: any) => {
          console.error("PayPal error:", err);
          toast({ title: "خطأ", description: "حدث خطأ في PayPal", variant: "destructive" });
        },
      }).render(containerRef.current);
    };

    loadSdk().then(render).catch((err) => { if (!cancelled) console.error(err); });
    return () => { cancelled = true; };
  }, [onApprove, toast]);

  return <div ref={containerRef} className="min-h-[50px]" />;
};

export default PayPalButton;
