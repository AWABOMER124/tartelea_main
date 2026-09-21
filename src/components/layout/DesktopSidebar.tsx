import { GraduationCap, Home, Library, Radio, Settings, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.jpeg";

const items = [
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/learn", label: "رحلتي التعليمية", icon: GraduationCap, matches: ["/learn", "/courses"] },
  { path: "/library", label: "المكتبة", icon: Library },
  { path: "/community", label: "المجتمع", icon: Users },
  { path: "/live", label: "اللقاءات المباشرة", icon: Radio, matches: ["/live", "/rooms", "/workshops", "/room-recordings", "/workshop-recordings"] },
  { path: "/profile", label: "ملفي", icon: User },
];

const DesktopSidebar = () => {
  const location = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-l border-border bg-[#FCFBF8] lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <img src={logoImage} alt="شعار المدرسة الترتيلية" className="h-10 w-10 rounded-[9px] object-cover" />
        <div>
          <p className="text-sm font-bold text-foreground">المدرسة الترتيلية</p>
          <p className="mt-0.5 text-xs text-muted-foreground">تعلّم · تدبّر · أثر</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-3" aria-label="التنقل الرئيسي">
        {items.map((item) => {
          const active = item.path === "/"
            ? location.pathname === "/"
            : (item.matches ?? [item.path]).some(
                (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
              );
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-[8px] px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          to="/profile"
          className="flex min-h-10 items-center gap-3 rounded-[8px] px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          الإعدادات والحساب
        </Link>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
