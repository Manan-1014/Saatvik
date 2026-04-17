import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminListInventory, useAdminListInventoryTransactions, useCreateInventoryTransaction, getAdminListInventoryQueryKey, getAdminListInventoryTransactionsQueryKey, useAdminListSnacks } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const transactionSchema = z.object({
  snackId: z.coerce.number().min(1, "Snack is required"),
  type: z.enum(["ADD", "SALE", "ADJUSTMENT"]),
  quantity: z.coerce.number(),
  note: z.string().optional(),
});
type TransactionFormData = z.infer<typeof transactionSchema>;

export default function InventoryManagement() {
  const { data: inventory, isLoading: isInvLoading } = useAdminListInventory();
  const { data: transactions, isLoading: isTxLoading } = useAdminListInventoryTransactions();
  const { data: snacks } = useAdminListSnacks();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { snackId: 0, type: "ADD", quantity: 0, note: "" },
  });

  const createTransaction = useCreateInventoryTransaction({
    mutation: {
      onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: getAdminListInventoryQueryKey() }); 
        queryClient.invalidateQueries({ queryKey: getAdminListInventoryTransactionsQueryKey() }); 
        setShowModal(false); 
        form.reset(); 
        toast({ title: "Transaction logged" }); 
      },
      onError: () => toast({ title: "Error logging transaction", variant: "destructive" }),
    }
  });

  const handleSubmit = (data: TransactionFormData) => {
    createTransaction.mutate({ data });
  };

  return (
    <AdminLayout>
      <div data-testid="admin-inventory">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Inventory Management</h1>
            <p className="text-sm text-muted-foreground">Manage and track snack stock levels</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Log Transaction
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Current Stock</h2>
                </div>
                {isInvLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Snack</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Available Quantity</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Updated</th>
                        </tr>
                        </thead>
                        <tbody>
                        {inventory?.map(inv => {
                            const snack = snacks?.find(s => s.id === inv.snackId);
                            return (
                                <tr key={inv.snackId} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-foreground">{snack?.name || `Product ID ${inv.snackId}`}</div>
                                </td>
                                <td className="px-4 py-3 font-medium">
                                    <span className={inv.quantity < 10 ? "text-red-500" : ""}>{inv.quantity}</span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{inv.updatedAt ? new Date(inv.updatedAt).toLocaleString() : 'N/A'}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Recent Transactions</h2>
                </div>
                {isTxLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Snack</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Qty</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Note</th>
                        </tr>
                        </thead>
                        <tbody>
                        {transactions?.map(tx => (
                            <tr key={tx.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 text-foreground">{tx.Snack?.name || `ID ${tx.snackId}`}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-1 rounded-full ${tx.type === 'ADD' ? 'bg-green-100 text-green-800' : tx.type === 'SALE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{tx.type}</span>
                                </td>
                                <td className="px-4 py-3 font-medium">{tx.quantity}</td>
                                <td className="px-4 py-3 text-muted-foreground truncate max-w-[100px]">{tx.note || "—"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>

        {/* Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Inventory Transaction</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField control={form.control} name="snackId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Snack</FormLabel>
                      <Select value={field.value?.toString() || ""} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select snack..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {snacks?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                            <SelectItem value="ADD">ADD (+)</SelectItem>
                            <SelectItem value="SALE">SALE (-)</SelectItem>
                            <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="quantity" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="note" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (Optional)</FormLabel>
                      <FormControl><Input placeholder="Reason for adjustment/addition" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary text-white" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? "Logging..." : "Log Transaction"}
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
