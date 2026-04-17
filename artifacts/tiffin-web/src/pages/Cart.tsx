import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useCreateOrder,
  useListDeliveryAreas,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

// ── helpers ──────────────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data as T;
}

interface RazorpayOrderResponse {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Cart() {
  const { isAuthenticated, user, token } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart({
    query: { enabled: isAuthenticated, queryKey: getGetCartQueryKey() },
  });
  const { data: areas } = useListDeliveryAreas();

  const updateItem = useUpdateCartItem({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
    },
  });
  const removeItem = useRemoveCartItem({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
    },
  });

  // ── Razorpay checkout launcher ─────────────────────────────────────────────

  const openRazorpayCheckout = useCallback(
    (orderId: number, rzpOrderRes: RazorpayOrderResponse) => {
      if (!window.Razorpay) {
        toast({
          title: "Payment unavailable",
          description: "Razorpay could not be loaded. Please try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }

      const options: RazorpayOptions = {
        key: RAZORPAY_KEY_ID,
        amount: rzpOrderRes.amount,
        currency: rzpOrderRes.currency,
        name: "Saatvik Jain Aahar Gruh",
        description: `Order #${orderId}`,
        order_id: rzpOrderRes.razorpay_order_id,

        prefill: {
          name: user?.name ?? undefined,
          email: user?.email ?? undefined,
          contact: user?.phone ?? undefined,
        },

        theme: { color: "#f97316" },

        // ── Payment success ──────────────────────────────────────────────────
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await apiPost(
              "/payments/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              token!
            );

            queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
            toast({
              title: "Payment successful!",
              description: `Order #${orderId} confirmed and paid.`,
            });
            setLocation("/track-order");
          } catch {
            toast({
              title: "Payment verification failed",
              description: "Your payment was received but verification failed. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setIsProcessingPayment(false);
          }
        },

        modal: {
          // ── Modal dismissed without completing payment ──────────────────
          ondismiss: async () => {
            try {
              await apiPost(
                "/payments/verify",
                {
                  razorpay_order_id: rzpOrderRes.razorpay_order_id,
                  error_code: "PAYMENT_CANCELLED",
                  error_description: "User closed the payment modal",
                },
                token!
              );
            } catch {
              // best-effort; order already marked payment_pending in DB
            }
            toast({
              title: "Payment cancelled",
              description: `Order #${orderId} was created but not paid. You can retry payment later.`,
              variant: "destructive",
            });
            setIsProcessingPayment(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // ── Payment failure event (card declined, etc.) ──────────────────────
      rzp.on("payment.failed", async (response: any) => {
        try {
          await apiPost(
            "/payments/verify",
            {
              razorpay_order_id: rzpOrderRes.razorpay_order_id,
              error_code: response.error?.code ?? "PAYMENT_FAILED",
              error_description: response.error?.description ?? "Payment failed",
            },
            token!
          );
        } catch {
          // best-effort
        }
        toast({
          title: "Payment failed",
          description: response.error?.description ?? "Payment could not be processed. Please try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
      });

      rzp.open();
    },
    [user, token, queryClient, toast, setLocation]
  );

  // ── Checkout handler ───────────────────────────────────────────────────────

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: async (order) => {
        if (paymentMethod === "razorpay") {
          // Step 2: create Razorpay order and open checkout
          try {
            const rzpOrderRes = await apiPost<RazorpayOrderResponse>(
              "/payments/create-order",
              { order_id: order.id },
              token!
            );
            openRazorpayCheckout(order.id, rzpOrderRes);
          } catch (err: any) {
            toast({
              title: "Could not initiate payment",
              description: err?.message ?? "Please try again.",
              variant: "destructive",
            });
            setIsProcessingPayment(false);
          }
        } else {
          // COD / GPay — order is placed, no extra payment step
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Order placed!", description: `Order #${order.id} confirmed.` });
          setLocation("/track-order");
        }
      },
      onError: (err: any) => {
        toast({
          title: "Order failed",
          description: err?.data?.error ?? "Please try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
      },
    },
  });

  function handleCheckout() {
    if (!selectedArea) return;
    setIsProcessingPayment(true);
    createOrder.mutate({
      data: {
        delivery_area_id: parseInt(selectedArea),
        payment_method: paymentMethod,
      },
    });
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const selectedAreaData = areas?.find((a) => a.id.toString() === selectedArea);
  const deliveryCharge = selectedAreaData ? parseFloat(selectedAreaData.delivery_charge as string) : 0;
  const subtotal = parseFloat(cart?.subtotal || "0");
  const total = subtotal + deliveryCharge;
  const isEmpty = !cart?.items || cart.items.length === 0;
  const isCheckoutBusy = createOrder.isPending || isProcessingPayment;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ShoppingCart className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Please login to view your cart</h2>
          <Link to="/login">
            <Button className="bg-primary text-white">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1
          className="text-3xl font-bold text-foreground mb-8"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Your Cart
        </h1>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        ) : isEmpty ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-testid="cart-empty"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Your cart is empty</h2>
            <p className="text-muted-foreground">Add some delicious items to get started!</p>
            <Link to="/menu">
              <Button className="bg-primary text-white" data-testid="btn-browse-menu">
                Browse Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* ── Cart Items ────────────────────────────────────────────── */}
            <div className="md:col-span-2 space-y-4">
              {cart.items.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-card border border-card-border rounded-2xl p-4 flex gap-4"
                  data-testid={`cart-item-${item.id}`}
                >
                  <img
                    src={
                      item.product?.image_url || item.snack?.imageUrl || 
                      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=100&q=80"
                    }
                    alt={item.product?.name || item.snack?.name}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-foreground text-sm"
                      data-testid={`text-cart-item-name-${item.id}`}
                    >
                      {item.product?.name || item.snack?.name}
                    </h3>
                    <p className="text-primary font-bold">&#x20B9;{item.product?.price || item.snack?.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        onClick={() =>
                          updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity - 1 } })
                        }
                        data-testid={`btn-decrease-${item.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span
                        className="w-8 text-center font-semibold"
                        data-testid={`text-quantity-${item.id}`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        onClick={() =>
                          updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity + 1 } })
                        }
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

            {/* ── Order Summary ─────────────────────────────────────────── */}
            <div
              className="bg-card border border-card-border rounded-2xl p-5 h-fit"
              data-testid="order-summary"
            >
              <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>

              {/* Delivery area */}
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-1.5 block">Delivery Area</label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {areas?.map((area) => (
                      <SelectItem
                        key={area.id}
                        value={area.id.toString()}
                        data-testid={`option-area-${area.id}`}
                      >
                        {area.name} (+&#x20B9;{area.delivery_charge})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment method */}
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-1.5 block">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                    <SelectItem value="razorpay">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4" />
                        Pay Online (Razorpay)
                      </span>
                    </SelectItem>
                    <SelectItem value="GPay">GPay / UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Razorpay badge */}
              {paymentMethod === "razorpay" && (
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  Secure payment via Razorpay — supports cards, UPI, netbanking &amp; wallets.
                </div>
              )}

              {/* Totals */}
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
                  <span className="text-primary" data-testid="text-total">
                    &#x20B9;{total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white mt-2"
                disabled={!selectedArea || isCheckoutBusy}
                onClick={handleCheckout}
                data-testid="btn-checkout"
              >
                {isCheckoutBusy
                  ? paymentMethod === "razorpay"
                    ? "Opening Payment..."
                    : "Placing Order..."
                  : paymentMethod === "razorpay"
                  ? "Pay Now"
                  : "Checkout"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
