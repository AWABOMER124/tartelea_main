import { Moon, Sun, Info } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useTheme } from "@/hooks/useTheme";
import logoImage from "@/assets/logo.jpeg";

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع المظلم"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring">
          <img src={logoImage} alt="" className="h-9 w-9 rounded-xl object-cover" />
          <h1 className="font-body text-base font-bold text-foreground sm:text-lg">
            المدرسة الترتيلية
          </h1>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/founder"
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="عن المدرسة والمؤسس"
          >
            <Info className="h-5 w-5" />
          </Link>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
