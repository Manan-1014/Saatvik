import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, ChevronDown, Images, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getGetCartQueryKey, useGetCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNav = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/snacks", label: "Snacks Store" },
  { to: "/contact", label: "Contact" },
  { to: "/track-order", label: "Track Order" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: getGetCartQueryKey() } });
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 8) {
        setCompact(false);
      } else if (y > lastY) {
        setCompact(true);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartCount = cart?.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0;

  return (
    <nav className={`bg-white border-b border-border sticky top-0 z-50 shadow-sm site-navbar ${compact ? "is-compact" : ""}`} data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2.5" data-testid="nav-logo">
            <BrandLogo className="h-10 w-10 shadow-sm ring-2 ring-primary/15" />
            <div className="leading-tight">
              <div className="font-bold text-sm text-foreground">Saatvik Jain</div>
              <div className="text-xs text-muted-foreground">Aahar Gruh</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {mainNav.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors nav-animated-link ${
                  location === l.to ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {l.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none ${
                    location === "/gallery" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  data-testid="nav-more-trigger"
                >
                  More
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/gallery" className="flex flex-col gap-0.5 py-2">
                    <span className="flex items-center gap-2 font-medium">
                      <Images className="w-4 h-4 text-primary" />
                      Gallery
                    </span>
                    <span className="text-xs text-muted-foreground font-normal pl-6">Kitchen, food &amp; events photos</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/contact" className="flex flex-col gap-0.5 py-2">
                    <span className="flex items-center gap-2 font-medium">
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      Bulk orders &amp; catering
                    </span>
                    <span className="text-xs text-muted-foreground font-normal pl-6">Events, corporate, weddings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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

        {open && (
          <div className="md:hidden py-3 border-t border-border space-y-1">
            {mainNav.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="block py-2 px-2 text-sm font-medium text-foreground hover:text-primary rounded-md"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/gallery" className="block py-2 px-2 text-sm font-medium text-foreground hover:text-primary rounded-md" onClick={() => setOpen(false)}>
              Gallery
            </Link>
            <Link to="/contact" className="block py-2 px-2 text-sm font-medium text-foreground hover:text-primary rounded-md" onClick={() => setOpen(false)}>
              Bulk orders &amp; catering
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
