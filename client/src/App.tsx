import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingPage } from "@/components/loading";

// Lazy load pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const SplashPage = lazy(() => import("@/pages/splash-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const LoginPage = lazy(() => import("@/pages/login-page"));
const JoinOrgPage = lazy(() => import("@/pages/join-org-page"));
const CreateOrgPage = lazy(() => import("@/pages/create-org-page"));
const InviteRedirectPage = lazy(() => import("@/pages/invite-redirect-page"));
const EmailDemoPage = lazy(() => import("@/pages/email-demo-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const CreateRequestPage = lazy(() => import("@/pages/create-request-page"));
const ApprovalsPage = lazy(() => import("@/pages/approvals-page"));
const OrgChartPage = lazy(() => import("@/pages/org-chart-page"));
const InvoiceUploadPage = lazy(() => import("@/pages/invoice-upload-page"));
const AdminSettingsPage = lazy(() => import("@/pages/admin-settings-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const DebugAuth = lazy(() => import("@/components/debug-auth").then(m => ({ default: m.DebugAuth })));
const DatabaseTest = lazy(() => import("@/components/database-test"));

// Loading component
const PageLoader = () => <LoadingPage title="Loading Page..." />;

function Router() {
  return (
    <Switch>
      {/* Splash screen - first page users see */}
      <Route path="/" component={() => <SplashPage />} />
      
      {/* Onboarding routes */}
      <Route path="/auth" component={() => <AuthPage />} />
      <Route path="/login" component={() => <LoginPage />} />
      <Route path="/join" component={() => <JoinOrgPage />} />
      <Route path="/invite/:token" component={() => <InviteRedirectPage />} />
      <Route path="/create-org" component={() => <CreateOrgPage />} />
      
      
      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={() => <DashboardPage />} />
      <ProtectedRoute path="/create-request" component={() => <CreateRequestPage />} />
      <ProtectedRoute path="/approvals" component={() => <ApprovalsPage />} />
      <ProtectedRoute path="/org-chart" component={() => <OrgChartPage />} />
      <ProtectedRoute path="/invoice-upload" component={() => <InvoiceUploadPage />} />
      <ProtectedRoute path="/profile" component={() => <ProfilePage />} />
             <ProtectedRoute path="/admin-settings" component={() => <AdminSettingsPage />} />
             <ProtectedRoute path="/admin" component={() => <AdminSettingsPage />} />
             <ProtectedRoute path="/email-demo" component={() => <EmailDemoPage />} />
             <Route path="/debug" component={() => <DebugAuth />} />
             <Route path="/test-db" component={() => <DatabaseTest />} />
      
      <Route component={() => <NotFound />} />
    </Switch>
  );
}

function AppLayout() {
  const [location] = useLocation();
  
  const isPublicRoute = 
    ['/', '/auth', '/login', '/join', '/create-org', '/verify-email', '/reset-password', '/forgot-password'].includes(location) || 
    location.startsWith('/invite/');

  return (
    <div className="flex h-screen w-full">
      {/* Conditionally render sidebar based on route */}
      {!isPublicRoute && <AppSidebar />}
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header with sidebar toggle - only on protected routes */}
        {!isPublicRoute && (
          <header className="flex items-center gap-2 border-b px-4 py-2 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
          </header>
        )}
        
        {/* Allow scrolling on all routes */}
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        </div>
        
        {/* Bottom navigation - only on protected routes */}
        {!isPublicRoute && <BottomNav />}
      </main>
    </div>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <AppLayout />
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
