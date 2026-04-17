import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Menu from "@/pages/Menu";
import SnacksStore from "@/pages/SnacksStore";
import Cart from "@/pages/Cart";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Contact from "@/pages/Contact";
import TrackOrder from "@/pages/TrackOrder";
import Gallery from "@/pages/Gallery";

import Dashboard from "@/pages/admin/Dashboard";
import MenuManagement from "@/pages/admin/MenuManagement";
import Orders from "@/pages/admin/Orders";
import DeliveryAreas from "@/pages/admin/DeliveryAreas";
import Settings from "@/pages/admin/Settings";
import SnacksManagement from "@/pages/admin/SnacksManagement";
import SnackCategoriesManagement from "@/pages/admin/SnackCategoriesManagement";
import InventoryManagement from "@/pages/admin/InventoryManagement";
import GalleryManagement from "@/pages/admin/GalleryManagement";
import { Footer } from "@/components/Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function MainRoutes() {
  const [location] = useLocation();
  const showSiteFooter = !location.startsWith("/admin");

  return (
    <div className={showSiteFooter ? "min-h-screen flex flex-col" : "min-h-screen"}>
      <div className={showSiteFooter ? "flex-1 flex flex-col" : "min-h-screen"}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/menu" component={Menu} />
          <Route path="/snacks" component={SnacksStore} />
          <Route path="/cart" component={Cart} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/contact" component={Contact} />
          <Route path="/track-order" component={TrackOrder} />
          <Route path="/gallery" component={Gallery} />

          <Route path="/admin">
            {() => (
              <ProtectedRoute adminOnly>
                <Dashboard />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/menu">
            {() => (
              <ProtectedRoute adminOnly>
                <MenuManagement />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/orders">
            {() => (
              <ProtectedRoute adminOnly>
                <Orders />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/delivery-areas">
            {() => (
              <ProtectedRoute adminOnly>
                <DeliveryAreas />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/settings">
            {() => (
              <ProtectedRoute adminOnly>
                <Settings />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/snacks">
            {() => (
              <ProtectedRoute adminOnly>
                <SnacksManagement />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/snack-categories">
            {() => (
              <ProtectedRoute adminOnly>
                <SnackCategoriesManagement />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/inventory">
            {() => (
              <ProtectedRoute adminOnly>
                <InventoryManagement />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/gallery">
            {() => (
              <ProtectedRoute adminOnly>
                <GalleryManagement />
              </ProtectedRoute>
            )}
          </Route>

          <Route component={NotFound} />
        </Switch>
      </div>
      {showSiteFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <MainRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
