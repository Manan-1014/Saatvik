import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { useGetCart, useUpdateCartItem, useRemoveCartItem, useCreateOrder, useListDeliveryAreas, getGetCartQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart({ query: { enabled: isAuthenticated, queryKey: getGetCartQueryKey() } });
  const { data: areas } = useListDeliveryAreas();

  const updateItem = useUpdateCartItem({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
    }
  });
  const removeItem = useRemoveCartItem({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
    }
  });
  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Order placed!", description: `Order #${order.id} confirmed.` });
        setLocation("/track-order");
      },
      onError: (err: any) => {
        toast({ title: "Order failed", description: err?.data?.error || "Please try again.", variant: "destructive" });
      }
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ShoppingCart className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Please login to view your cart</h2>
          <Link to="/login"><Button className="bg-primary text-white">Login</Button></Link>
        </div>
      </div>
    );
  }

  const selectedAreaData = areas?.find(a => a.id.toString() === selectedArea);
  const deliveryCharge = selectedAreaData ? parseFloat(selectedAreaData.delivery_charge as string) : 0;
  const subtotal = parseFloat(cart?.subtotal || "0");
  const total = subtotal + deliveryCharge;

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>Your Cart</h1>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="cart-empty">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Your cart is empty</h2>
            <p className="text-muted-foreground">Add some delicious items to get started!</p>
            <Link to="/menu">
              <Button className="bg-primary text-white" data-testid="btn-browse-menu">Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Items */}
            <div className="md:col-span-2 space-y-4">
              {cart.items.map((item: any) => (
                <div key={item.id} className="bg-card border border-card-border rounded-2xl p-4 flex gap-4" data-testid={`cart-item-${item.id}`}>
                  <img
                    src={item.product?.image_url || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=100&q=80"}
                    alt={item.product?.name}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm" data-testid={`text-cart-item-name-${item.id}`}>{item.product?.name}</h3>
                    <p className="text-primary font-bold">&#x20B9;{item.product?.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        onClick={() => updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity - 1 } })}
                        data-testid={`btn-decrease-${item.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                      <button
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        onClick={() => updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity + 1 } })}
                        data-testid={`btn-increase-${item.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        className="ml-auto text-destructive hover:text-destructive/80 transition-colors"
                        onClick={() => removeItem.mutate({ itemId: item.id })}
                        data-testid={`btn-remove-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-card border border-card-border rounded-2xl p-5 h-fit" data-testid="order-summary">
              <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
              
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-1.5 block">Delivery Area</label>
                <Select value={selectedArea} onValueChange={setSelectedArea} data-testid="select-delivery-area">
                  <SelectTrigger>
                    <SelectValue placeholder="Select area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {areas?.map(area => (
                      <SelectItem key={area.id} value={area.id.toString()} data-testid={`option-area-${area.id}`}>
                        {area.name} (+&#x20B9;{area.delivery_charge})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-1.5 block">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                    <SelectItem value="GPay">GPay / UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 py-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">&#x20B9;{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium">&#x20B9;{deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-total">&#x20B9;{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white mt-2"
                disabled={!selectedArea || createOrder.isPending}
                onClick={() => createOrder.mutate({ data: { delivery_area_id: parseInt(selectedArea), payment_method: paymentMethod } })}
                data-testid="btn-checkout"
              >
                {createOrder.isPending ? "Placing Order..." : "Checkout"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
