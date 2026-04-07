import { ReactNode, useCallback } from "react";
import { Link } from "react-router-dom";
import TopBar from "./TopBar";
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
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
      />
      <main className="flex-1 pb-24">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {showFooter && (
        <footer className="border-t border-border bg-card py-4 px-4 mb-20">
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
  );
};

export default AppLayout;
