import { Suspense, useEffect } from "react";
import { Toaster as Sonner } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { useCapacitorInit } from "@/hooks/useCapacitorInit";
import { isNativePlatform } from "@/lib/capacitor/platform";
import { AuthProvider } from "@/hooks/useAuth";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const Index = lazyWithRetry(() => import("./pages/Index"));
const Library = lazyWithRetry(() => import("./pages/Library"));
const Community = lazyWithRetry(() => import("./pages/Community"));
const SudanAwareness = lazyWithRetry(() => import("./pages/SudanAwareness"));
const ArabAwareness = lazyWithRetry(() => import("./pages/ArabAwareness"));
const IslamicAwareness = lazyWithRetry(() => import("./pages/IslamicAwareness"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const ContentDetail = lazyWithRetry(() => import("./pages/ContentDetail"));
const TrainerDashboard = lazyWithRetry(() => import("./pages/TrainerDashboard"));
const TrainerProfile = lazyWithRetry(() => import("./pages/TrainerProfile"));
const Courses = lazyWithRetry(() => import("./pages/Courses"));
const CourseDetail = lazyWithRetry(() => import("./pages/CourseDetail"));
const CertificateView = lazyWithRetry(() => import("./pages/CertificateView"));
const Subscription = lazyWithRetry(() => import("./pages/Subscription"));
const Workshops = lazyWithRetry(() => import("./pages/Workshops"));
const WorkshopDetail = lazyWithRetry(() => import("./pages/WorkshopDetail"));
const Rooms = lazyWithRetry(() => import("./pages/Rooms"));
const WorkshopLive = lazyWithRetry(() => import("./pages/WorkshopLive"));
const RoomLive = lazyWithRetry(() => import("./pages/RoomLive"));
const RoomRecordings = lazyWithRetry(() => import("./pages/RoomRecordings"));
const WorkshopRecordings = lazyWithRetry(() => import("./pages/WorkshopRecordings"));
const WorkshopRecordingPlayer = lazyWithRetry(() => import("./pages/WorkshopRecordingPlayer"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const Bookings = lazyWithRetry(() => import("./pages/Bookings"));
const PostDetail = lazyWithRetry(() => import("./pages/PostDetail"));
const Founder = lazyWithRetry(() => import("./pages/Founder"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const About = lazyWithRetry(() => import("./pages/About"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const BlogPostPage = lazyWithRetry(() => import("./pages/BlogPost"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/**
 * Inner app component - must be inside BrowserRouter for hooks
 */
const AppInner = () => {
  // Initialize Capacitor native services (push, deep links, etc.)
  useCapacitorInit();

  // Setup StatusBar for native
  useEffect(() => {
    if (isNativePlatform()) {
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
        StatusBar.setBackgroundColor({ color: '#F2EDE4' }).catch(() => {});
      });
    }
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/library" element={<Library />} />
        <Route path="/content/:id" element={<ContentDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/certificate/:id" element={<CertificateView />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/workshops" element={<Workshops />} />
        <Route path="/workshops/:id" element={<WorkshopDetail />} />
        <Route path="/workshops/:id/live" element={<WorkshopLive />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:id/live" element={<RoomLive />} />
        <Route path="/room-recordings" element={<RoomRecordings />} />
        <Route path="/workshop-recordings" element={<WorkshopRecordings />} />
        <Route path="/workshop-recording/:id" element={<WorkshopRecordingPlayer />} />
        <Route path="/arab-awareness" element={<ArabAwareness />} />
        <Route path="/islamic-awareness" element={<IslamicAwareness />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/trainer" element={<TrainerDashboard />} />
        <Route path="/trainer/:id" element={<TrainerProfile />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/founder" element={<Founder />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/sudan-awareness" element={<SudanAwareness />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPostPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
