import { useState } from "react";
import { Plus, Pencil, Trash2, Lightbulb } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAdminListDeliveryAreas, useCreateDeliveryArea, useUpdateDeliveryArea, useDeleteDeliveryArea, useToggleDeliveryArea, getAdminListDeliveryAreasQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const areaSchema = z.object({
  name: z.string().min(1, "Name required"),
  delivery_charge: z.string().min(1, "Charge required"),
  status: z.coerce.number().default(1),
});
type AreaFormData = z.infer<typeof areaSchema>;

export default function DeliveryAreas() {
  const { data: areas, isLoading } = useAdminListDeliveryAreas();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editArea, setEditArea] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: "", delivery_charge: "", status: 1 },
  });

  const createArea = useCreateDeliveryArea({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getAdminListDeliveryAreasQueryKey() }); setShowModal(false); form.reset(); toast({ title: "Area added" }); } } });
  const updateArea = useUpdateDeliveryArea({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getAdminListDeliveryAreasQueryKey() }); setShowModal(false); setEditArea(null); toast({ title: "Area updated" }); } } });
  const deleteArea = useDeleteDeliveryArea({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getAdminListDeliveryAreasQueryKey() }); toast({ title: "Area deleted" }); } } });
  const toggleArea = useToggleDeliveryArea({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListDeliveryAreasQueryKey() }) } });

  const handleOpenModal = (area?: any) => {
    if (area) {
      setEditArea(area);
      form.reset({ name: area.name, delivery_charge: area.delivery_charge?.toString() || "", status: area.status });
    } else {
      setEditArea(null);
      form.reset({ name: "", delivery_charge: "", status: 1 });
    }
    setShowModal(true);
  };

  const handleSubmit = (data: AreaFormData) => {
    if (editArea) {
      updateArea.mutate({ id: editArea.id, data });
    } else {
      createArea.mutate({ data });
    }
  };

  return (
    <AdminLayout>
      <div data-testid="admin-delivery-areas">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Delivery Areas</h1>
            <p className="text-sm text-muted-foreground">Manage delivery areas and charges</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => handleOpenModal()} data-testid="btn-add-area">
            <Plus className="w-4 h-4 mr-2" /> Add Area
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 animate-pulse">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 bg-muted rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {areas?.map(area => (
              <div key={area.id} className={`bg-card border rounded-xl p-5 ${area.status !== 1 ? "border-border opacity-70" : "border-card-border"}`} data-testid={`card-area-${area.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{area.name}</h3>
                  <Switch
                    checked={area.status === 1}
                    onCheckedChange={() => toggleArea.mutate({ id: area.id })}
                    data-testid={`toggle-area-${area.id}`}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Delivery Charge: &#x20B9;{area.delivery_charge}</p>
                {area.status !== 1 && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-3 text-center">
                    Deliveries Disabled
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => handleOpenModal(area)} data-testid={`btn-edit-area-${area.id}`}>
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => deleteArea.mutate({ id: area.id })} data-testid={`btn-delete-area-${area.id}`}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-amber-800 text-sm">Delivery Area Tips</h3>
          </div>
          <ul className="space-y-1 text-xs text-amber-700">
            <li>• Set appropriate delivery charges based on distance</li>
            <li>• Disable areas temporarily if delivery partners are unavailable</li>
            <li>• Keep delivery areas updated to ensure smooth operations</li>
          </ul>
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editArea ? "Edit Delivery Area" : "Add Delivery Area"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Vastrapur" {...field} data-testid="input-area-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="delivery_charge" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Charge (₹)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="20" {...field} data-testid="input-area-charge" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary text-white" disabled={createArea.isPending || updateArea.isPending} data-testid="btn-save-area">
                    {createArea.isPending || updateArea.isPending ? "Saving..." : "Save"}
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
