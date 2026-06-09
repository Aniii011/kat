import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider, useAuth } from "@/context/auth-context";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ListingDetail from "@/pages/listing-detail";
import ThriftDrops from "@/pages/thrift-drops";
import Boards from "@/pages/boards";
import BoardDetail from "@/pages/board-detail";
import Cart from "@/pages/cart";
import Search from "@/pages/search";
import Me from "@/pages/me";
import Seller from "@/pages/seller";
import AdminSellers from "@/pages/admin-sellers";
import AdminOrders from "@/pages/admin-orders";
import ResetPassword from "@/pages/reset-password";

import BottomNav from "@/components/bottom-nav";
import AiAssistant from "@/components/ai-assistant";

const queryClient = new QueryClient();

/* ---------------- ROUTER ---------------- */

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/thrift-drops" component={ThriftDrops} />
      <Route path="/boards" component={Boards} />
      <Route path="/boards/:id" component={BoardDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/search" component={Search} />
      <Route path="/me" component={Me} />
      <Route path="/seller" component={Seller} />
      <Route path="/admin/sellers" component={AdminSellers} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

/* ---------------- APP CONTENT (AUTH SAFE) ---------------- */

function AppContent() {
  const { loading } = useAuth();

  // 🔥 CRITICAL: prevent black screen / flash / race conditions
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Router />
          <BottomNav />
          <AiAssistant />
          <Toaster />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/* ---------------- ROOT APP ---------------- */

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
