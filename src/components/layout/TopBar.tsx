import { Moon, Sun, Sparkles, User } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useTheme } from "@/hooks/useTheme";

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع المظلم"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="h-6 w-6 text-accent" />
          <h1 className="text-lg font-display font-bold text-foreground">
            المدرسة الترتيلية
          </h1>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/founder"
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="المؤسس"
          >
            <User className="h-5 w-5" />
          </Link>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
