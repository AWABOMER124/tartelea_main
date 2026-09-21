import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import TadabburChat from "./TadabburChat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const handleClick = () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول لاستخدام مساعد التدبر",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(true);
  };

  if (loading) return null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              size="icon"
              aria-label="فتح مساعد التدبر"
              className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 z-40 h-12 w-12 rounded-2xl bg-primary shadow-md hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            مساعد التدبر
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TadabburChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatButton;
