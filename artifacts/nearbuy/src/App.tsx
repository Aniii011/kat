import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/auth-context";
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
import AuthCallback from "@/pages/AuthCallback";
import SellerOrders from "@/pages/seller-orders";
import Store from "@/pages/store";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import WishlistPage from "@/pages/wishlist";
import WishlistView from "@/pages/wishlist-view";

const queryClient = new QueryClient();

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
      <Route path="/store/:sellerId" component={Store} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/wishlists" component={WishlistPage} />
      <Route path="/wishlist/:id" component={WishlistView} />
      <Route path="/seller/orders" component={SellerOrders} />
      <Route path="/admin/sellers" component={AdminSellers} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter>
              <BottomNav />
              <main className="min-h-screen">
                <Router />
              </main>
              <AiAssistant />
              
              <Toaster />
            </WouterRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
