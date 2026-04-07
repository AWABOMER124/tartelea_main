import { Home, BookOpen, Users, User, Sparkles, Headphones } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "الرئيسية" },
  { path: "/library", icon: BookOpen, label: "المكتبة" },
  { path: "/rooms", icon: Headphones, label: "الغرف" },
  { path: "/courses", icon: Sparkles, label: "المسارات" },
  { path: "/community", icon: Users, label: "المجتمع" },
  { path: "/profile", icon: User, label: "حسابي" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item flex-1 relative transition-all duration-200",
                isActive && "nav-item-active"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-primary transition-all duration-300" />
              )}
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10 scale-110"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 transition-all",
                  isActive ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
