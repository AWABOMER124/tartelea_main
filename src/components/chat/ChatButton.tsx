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
              className="fixed bottom-24 left-4 z-40 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="h-6 w-6" />
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
