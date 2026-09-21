import { Home, BookOpen, Users, User, Radio } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "الرئيسية" },
  { path: "/learn", icon: BookOpen, label: "تعلّم", matches: ["/learn", "/library", "/courses", "/workshops", "/workshop-recordings"] },
  { path: "/live", icon: Radio, label: "مباشر", matches: ["/live", "/rooms", "/room-recordings"] },
  { path: "/community", icon: Users, label: "المجتمع" },
  { path: "/profile", icon: User, label: "حسابي" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav aria-label="التنقّل الرئيسي" className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = item.path === "/"
            ? location.pathname === "/"
            : (item.matches ?? [item.path]).some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "nav-item relative min-h-14 flex-1 rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isActive && "nav-item-active"
              )}
            >
              {isActive && (
                <span aria-hidden="true" className="absolute -top-1.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
              <div
                className={cn(
                  "rounded-lg p-1.5 transition-colors",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
              </div>
              <span
                className={cn(
                  "mt-0.5 text-[11px] transition-colors",
                  isActive ? "font-semibold text-primary" : "text-muted-foreground"
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
