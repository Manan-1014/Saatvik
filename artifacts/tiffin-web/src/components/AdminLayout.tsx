import { Link, useLocation } from "wouter";
import { LayoutDashboard, UtensilsCrossed, ClipboardList, MapPin, Settings, ArrowLeft, Leaf, Bell } from "lucide-react";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminListOrders } from "@workspace/api-client-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: orders } = useAdminListOrders({ status: "pending" });
  const pendingCount = orders?.length ?? 0;

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/menu", icon: UtensilsCrossed, label: "Menu Management" },
    { to: "/admin/orders", icon: ClipboardList, label: "Orders", badge: pendingCount },
    { to: "/admin/delivery-areas", icon: MapPin, label: "Delivery Areas" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-sidebar-foreground">Saatvik Jain</div>
              <div className="text-xs text-sidebar-foreground/60">Admin Panel</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0] ?? "M"}
            </div>
            <div>
              <div className="text-sm font-medium text-sidebar-foreground">Maharaj Ji</div>
              <div className="text-xs text-sidebar-foreground/60">Owner / Cook</div>
            </div>
          </div>
        </div>

        <div className="p-3 flex-1">
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2 px-2">Navigation</div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = location === item.to || (item.to !== "/admin" && location.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary text-white" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                  data-testid={`admin-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Website
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-border">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              Kitchen Open
            </span>
            <button className="relative" data-testid="admin-notifications">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {pendingCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
