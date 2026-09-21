import { Info, Moon, Sun, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationBell from "@/components/notifications/NotificationBell";
import GlobalSearch from "@/components/search/GlobalSearch";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@/assets/logo.jpeg";

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const initials = user?.full_name?.trim()?.charAt(0) || user?.email?.charAt(0) || "م";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="hidden min-w-0 max-w-md flex-1 lg:block">
          <GlobalSearch />
        </div>

        <Link
          to="/"
          className="mx-auto flex items-center gap-2 outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <img src={logoImage} alt="شعار المدرسة الترتيلية" className="h-9 w-9 rounded-[9px] object-cover" />
          <span className="text-sm font-bold text-foreground sm:text-base">المدرسة الترتيلية</span>
        </Link>

        <div className="mr-auto flex items-center gap-1 lg:mr-0">
          <NotificationBell />
          <Link
            to="/founder"
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="عن المدرسة والمؤسس"
          >
            <Info className="h-4 w-4" />
          </Link>
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع المظلم"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/profile"
            className="hidden h-9 min-w-9 items-center justify-center rounded-[8px] border border-border bg-secondary px-2 text-sm font-bold text-primary lg:flex"
            aria-label="الملف الشخصي"
          >
            {user ? initials : <UserRound className="h-4 w-4" />}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
