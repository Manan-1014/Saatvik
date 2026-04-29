import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Package, Cookie, Plus, Zap } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import {
  useListSnacks,
  getListSnacksQueryKey,
  useAddToCart,
  getGetCartQueryKey,
  useListSnackCategories,
  useGetCart,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function SnacksStore() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const { data: categories } = useListSnackCategories();
  const sortedCategories = [...(categories ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const queryParams: { search?: string; snack_category_id?: number } = {};
  if (search) queryParams.search = search;
  if (activeCategoryId) queryParams.snack_category_id = activeCategoryId;

  const { data: snacks, isLoading } = useListSnacks(queryParams);
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: getGetCartQueryKey() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSnacksQueryKey() });
        toast({ title: "Added to cart", description: "You can review items in your cart." });
      },
      onError: (err: any) =>
        toast({ title: "Could not add", description: err?.data?.error || "Please try again.", variant: "destructive" }),
    },
  });

  const cartCount = cart?.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0;

  const handleAddToCart = (snack: any, qty = 1) => {
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please log in to add snacks to your cart.", variant: "destructive" });
      return;
    }
    addToCart.mutate({ data: { snack_id: snack.id, quantity: qty } });
  };

  const handleBuyNow = (snack: any) => {
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please log in to continue to checkout.", variant: "destructive" });
      return;
    }
    addToCart.mutate(
      { data: { snack_id: snack.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          setLocation("/cart");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-green-600 font-semibold mb-3">
            <BrandLogo className="h-8 w-8 ring-2 ring-green-200" />
            <span className="uppercase tracking-wider text-sm">100% Jain Snacks</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Snacks Store
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Authentic Jain dry snacks — Khakhra, Namkeen, Farsan & Sweets. Packed fresh, delivered fast.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Fresh stock</span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">Login to cart</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Live Counter</span>
          </div>
        </div>

        <div className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between max-w-4xl">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                className="pl-10 h-12 bg-white border-card-border rounded-full shadow-sm text-base"
                placeholder="Search snacks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link
              to="/cart"
              className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-white border border-card-border shadow-sm text-sm font-medium text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap"
            >
              <ShoppingCart className="w-5 h-5 text-primary" />
              {cartCount} {cartCount === 1 ? "item" : "items"} in cart
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-3">
            <button
              type="button"
              onClick={() => setActiveCategoryId(null)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all ${
                activeCategoryId === null
                  ? "bg-primary text-white shadow-md font-medium"
                  : "bg-white text-foreground border border-border hover:bg-muted"
              }`}
            >
              All Items
            </button>
            {sortedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all ${
                  activeCategoryId === cat.id
                    ? "bg-primary text-white shadow-md font-medium"
                    : "bg-white text-foreground border border-border hover:bg-muted"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <span className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{snacks?.length || 0}</span> items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground text-lg">Loading amazing snacks...</div>
          ) : snacks?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground text-lg">No snacks found matching your criteria.</div>
          ) : (
            snacks?.map((snack) => {
              const stock = snack.Inventory?.quantity ?? 0;
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={snack.id}
                  className="bg-white rounded-2xl shadow-sm border border-card-border overflow-hidden group hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {snack.imageUrl ? (
                      <img
                        src={snack.imageUrl}
                        alt={snack.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-200">
                        <Cookie className="w-16 h-16" />
                      </div>
                    )}
                    {snack.status === 1 && stock <= 5 && stock > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-sm">
                        Only {stock} left
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute top-3 right-3 bg-gray-600 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-sm">
                        Out of stock
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-semibold text-lg leading-tight text-foreground">{snack.name}</h3>
                      {snack.weight && (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md whitespace-nowrap shrink-0">
                          {snack.weight}
                        </span>
                      )}
                    </div>
                    {snack.SnackCategory?.name && (
                      <p className="text-xs text-primary/80 font-medium mb-1">{snack.SnackCategory.name}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{snack.description}</p>
                    <p className="text-xs text-muted-foreground mb-3">In stock: {stock}</p>

                    <div className="flex items-center justify-between gap-2 mt-auto flex-wrap">
                      <span className="font-bold text-xl text-foreground">₹{snack.price}</span>
                      <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                        {!isAuthenticated ? (
                          <Button asChild size="sm" className="rounded-full bg-primary text-white">
                            <Link to="/login">Login to order</Link>
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isOutOfStock || addToCart.isPending}
                              onClick={() => handleAddToCart(snack)}
                              className="rounded-full border-primary/40"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add to cart
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isOutOfStock || addToCart.isPending}
                              onClick={() => handleBuyNow(snack)}
                              className="rounded-full bg-primary text-white hover:bg-primary/90 shadow-sm"
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Buy now
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                Bulk Snacks Orders
              </h2>
              <p className="text-muted-foreground max-w-md">Planning an event or want to stock up? Contact us for bulk pricing on all snack items.</p>
            </div>
          </div>
          <a
            href="https://wa.me/919876543210?text=Hi, I would like to inquire about bulk snacks order."
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-4 rounded-xl transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
          >
            Chat on WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
