import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  originalPrice?: number;
  price?: number;
  currency?: string;
  showBadge?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const PriceDisplay = ({ 
  originalPrice, 
  price,
  currency = "$", 
  showBadge = true,
  className = "",
  size = "md"
}: PriceDisplayProps) => {
  const { canGetDiscount, discountPercent, loading } = useSubscription();
  
  // Support both originalPrice and price props
  const displayPrice = originalPrice ?? price ?? 0;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  // Show "مجاني" for free items
  if (displayPrice === 0) {
    return (
      <Badge variant="secondary" className={cn("text-xs", className)}>
        مجاني
      </Badge>
    );
  }

  if (loading) {
    return (
      <span className={cn(sizeClasses[size], className)}>
        {currency}{displayPrice.toFixed(2)}
      </span>
    );
  }

  if (canGetDiscount) {
    const discountedPrice = displayPrice * (1 - discountPercent);
    const badgePercent = Math.round(discountPercent * 100);

    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        <span className={cn("text-muted-foreground line-through", sizeClasses[size])}>
          {currency}{displayPrice.toFixed(2)}
        </span>
        <span className={cn("font-bold text-primary", sizeClasses[size])}>
          {currency}{discountedPrice.toFixed(2)}
        </span>
        {showBadge && (
          <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs">
            <Percent className="h-3 w-3 ml-1" />
            -{badgePercent}%
          </Badge>
        )}
      </div>
    );
  }

  return (
    <span className={cn(sizeClasses[size], className)}>
      {currency}{displayPrice.toFixed(2)}
    </span>
  );
};

export default PriceDisplay;
