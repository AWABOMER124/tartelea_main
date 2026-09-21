import { ReactNode, useCallback } from "react";
import { Link } from "react-router-dom";
import TopBar from "./TopBar";
import DesktopSidebar from "./DesktopSidebar";
import BottomNav from "./BottomNav";
import ChatButton from "@/components/chat/ChatButton";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import OnboardingDialog from "@/components/onboarding/OnboardingDialog";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface AppLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

const AppLayout = ({ children, showFooter = true }: AppLayoutProps) => {
  const handleRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh(handleRefresh);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <DesktopSidebar />
      <div className="app-content-with-sidebar flex min-h-screen flex-1 flex-col">
      <TopBar />
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
      />
      <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {showFooter && (
        <footer className="mb-[calc(4.5rem+env(safe-area-inset-bottom))] border-t border-border bg-card px-4 py-4 lg:mb-0">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© 2026 المدرسة الترتيلية. جميع الحقوق محفوظة.</p>
            <div className="flex gap-4">
              <Link to="/terms" className="hover:text-primary transition-colors">
                شروط الاستخدام
              </Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">
                سياسة الخصوصية
              </Link>
            </div>
          </div>
        </footer>
      )}

      <BottomNav />
      <ChatButton />
      <OnboardingDialog />
      </div>
    </div>
  );
};

export default AppLayout;
