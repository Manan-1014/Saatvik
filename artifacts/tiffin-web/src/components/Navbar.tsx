import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, Leaf } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getGetCartQueryKey, useGetCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: getGetCartQueryKey() } });

  const cartCount = cart?.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0;

  const links = [
    { to: "/", label: "Home" },
    { to: "/menu", label: "Menu" },
    { to: "/contact", label: "Contact" },
    { to: "/track-order", label: "Track Order" },
  ];

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm text-foreground">Saatvik Jain</div>
              <div className="text-xs text-muted-foreground">Aahar Gruh</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors ${location === l.to ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`nav-link-${l.label.toLowerCase().replace(" ", "-")}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative" data-testid="nav-cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={logout} data-testid="btn-logout">
                Logout
              </Button>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" data-testid="btn-login">
                  Login
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden py-3 border-t border-border">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="block py-2 text-sm font-medium text-foreground hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
