import { useState } from "react";
import { Plus, Pencil, Trash2, Minus, Plus as PlusIcon } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminListSnacks,
  useCreateSnack,
  useUpdateSnack,
  useDeleteSnack,
  useToggleSnackStatus,
  useAdminListSnackCategories,
  useCreateInventoryTransaction,
  getAdminListSnacksQueryKey,
  getAdminListInventoryQueryKey,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const snackSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Invalid price"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  imageUrl: z.string().optional(),
  snackCategoryId: z.coerce.number().min(1, "Snack category required"),
  weight: z.string().optional(),
  status: z.coerce.number().default(1),
});
type SnackFormData = z.infer<typeof snackSchema>;

export default function SnacksManagement() {
  const { data: snacks, isLoading } = useAdminListSnacks();
  const { data: snackCategories } = useAdminListSnackCategories();
  const activeSnackCategories = snackCategories?.filter((c) => c.status === 1) ?? [];
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editSnack, setEditSnack] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const form = useForm<SnackFormData>({
    resolver: zodResolver(snackSchema),
    defaultValues: { name: "", description: "", price: 0, stock: 0, imageUrl: "", snackCategoryId: 0, weight: "", status: 1 },
  });

  const stockMut = useCreateInventoryTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSnacksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminListInventoryQueryKey() });
        toast({ title: "Stock updated" });
      },
      onError: (err: any) =>
        toast({
          title: "Stock update failed",
          description: err?.message || err?.data?.error,
          variant: "destructive",
        }),
    },
  });

  const createSnack = useCreateSnack({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSnacksQueryKey() });
        setShowModal(false);
        form.reset();
        toast({ title: "Snack created" });
      },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    },
  });

  const updateSnack = useUpdateSnack({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSnacksQueryKey() });
        setShowModal(false);
        setEditSnack(null);
        form.reset();
        toast({ title: "Snack updated" });
      },
    },
  });

  const deleteSnack = useDeleteSnack({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSnacksQueryKey() });
        toast({ title: "Snack deleted" });
      },
    },
  });

  const toggleStatus = useToggleSnackStatus({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListSnacksQueryKey() }),
    },
  });

  const handleOpenModal = (snack?: any) => {
    if (snack) {
      setEditSnack(snack);
      form.reset({
        name: snack.name,
        description: snack.description || "",
        price: parseFloat(snack.price) || 0,
        stock: snack.Inventory?.quantity ?? 0,
        imageUrl: snack.imageUrl || "",
        snackCategoryId: snack.snackCategoryId || 0,
        weight: snack.weight || "",
        status: snack.status,
      });
    } else {
      setEditSnack(null);
      form.reset({ name: "", description: "", price: 0, stock: 0, imageUrl: "", snackCategoryId: 0, weight: "", status: 1 });
    }
    setShowModal(true);
  };

  const handleSubmit = (data: SnackFormData) => {
    const { stock, ...snackPayload } = data;

    if (editSnack) {
      const currentStock = editSnack.Inventory?.quantity ?? 0;
      const delta = stock - currentStock;

      updateSnack.mutate(
        { id: editSnack.id, data: snackPayload },
        {
          onSuccess: () => {
            if (delta !== 0) {
              adjustStock(editSnack.id, delta > 0 ? "ADD" : "SALE", Math.abs(delta));
            }
          },
        }
      );
    } else {
      createSnack.mutate(
        { data: snackPayload },
        {
          onSuccess: (createdSnack: any) => {
            if (stock > 0 && createdSnack?.id) {
              adjustStock(createdSnack.id, "ADD", stock);
            }
          },
        }
      );
    }
  };

  function adjustStock(snackId: number, type: "ADD" | "SALE", qty: number) {
    stockMut.mutate({
      data: {
        snackId,
        type,
        quantity: qty,
        note: type === "ADD" ? "Manual restock (snacks admin)" : "Manual reduction (snacks admin)",
      },
    });
  }

  return (
    <AdminLayout>
      <div data-testid="admin-snacks">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>
              Snacks Management
            </h1>
            <p className="text-sm text-muted-foreground">Manage snack items, stock, and snack categories from the sidebar.</p>
          </div>
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white" onClick={() => handleOpenModal()} data-testid="btn-add-snack">
            <Plus className="w-4 h-4 mr-2" /> Add New Snack
          </Button>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">All Snacks</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Snack Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Weight</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Stock</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {snacks?.map((snack) => {
                    const qty = snack.Inventory?.quantity ?? 0;
                    return (
                      <tr key={snack.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors" data-testid={`row-snack-${snack.id}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-foreground">{snack.name}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{snack.SnackCategory?.name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{snack.weight || "—"}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap">&#x20B9;{snack.price}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 sm:h-8 sm:w-8 shrink-0"
                              disabled={stockMut.isPending || qty <= 0}
                              onClick={() => adjustStock(snack.id, "SALE", 1)}
                              title="Remove 1 from stock"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="min-w-[2rem] text-center font-semibold tabular-nums">{qty}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 sm:h-8 sm:w-8 shrink-0"
                              disabled={stockMut.isPending}
                              onClick={() => adjustStock(snack.id, "ADD", 1)}
                              title="Add 1 to stock"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Switch checked={snack.status === 1} onCheckedChange={() => toggleStatus.mutate({ id: snack.id })} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" onClick={() => handleOpenModal(snack)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => deleteSnack.mutate({ id: snack.id })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editSnack ? "Edit Snack" : "Add New Snack"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (e.g., 200g)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="snackCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Snack category</FormLabel>
                        <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(parseInt(v, 10))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeSnackCategories.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(parseInt(v))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Active</SelectItem>
                            <SelectItem value="0">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea className="resize-none h-20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto bg-primary text-white" disabled={createSnack.isPending || updateSnack.isPending}>
                    {createSnack.isPending || updateSnack.isPending ? "Saving..." : "Save Snack"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
