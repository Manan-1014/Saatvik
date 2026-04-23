import { useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAdminListSnackCategories,
  useCreateSnackCategory,
  useUpdateSnackCategory,
  useDeleteSnackCategory,
  getAdminListSnackCategoriesQueryKey,
  getListSnackCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  sortOrder: z.coerce.number().int().default(0),
  status: z.coerce.number().default(1),
});
type FormData = z.infer<typeof schema>;

export default function SnackCategoriesManagement() {
  const { data: rows, isLoading } = useAdminListSnackCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [edit, setEdit] = useState<{ id: number } | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", sortOrder: 0, status: 1 },
  });

  const createMut = useCreateSnackCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSnackCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSnackCategoriesQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Category created" });
      },
      onError: () => toast({ title: "Could not create", variant: "destructive" }),
    },
  });

  const updateMut = useUpdateSnackCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSnackCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSnackCategoriesQueryKey() });
        setOpen(false);
        setEdit(null);
        form.reset();
        toast({ title: "Category updated" });
      },
      onError: () => toast({ title: "Could not update", variant: "destructive" }),
    },
  });

  const deleteMut = useDeleteSnackCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSnackCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSnackCategoriesQueryKey() });
        toast({ title: "Category removed" });
      },
      onError: () => toast({ title: "Could not delete", variant: "destructive" }),
    },
  });

  function openModal(row?: any) {
    if (row) {
      setEdit({ id: row.id });
      form.reset({
        name: row.name,
        sortOrder: row.sortOrder ?? 0,
        status: row.status,
      });
    } else {
      setEdit(null);
      form.reset({ name: "", sortOrder: (rows?.length ?? 0) + 1, status: 1 });
    }
    setOpen(true);
  }

  function onSubmit(data: FormData) {
    if (edit) {
      updateMut.mutate({ id: edit.id, data: { name: data.name, sortOrder: data.sortOrder, status: data.status } });
    } else {
      createMut.mutate({ data: { name: data.name, sortOrder: data.sortOrder, status: data.status } });
    }
  }

  return (
    <AdminLayout>
      <div data-testid="admin-snack-categories">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              <Tags className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              Snack categories
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Categories used on the Snacks Store page (separate from menu categories).
            </p>
          </div>
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add category
          </Button>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Sort</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows?.map((r) => (
                    <tr key={r.id} className="border-t border-border/50">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.sortOrder}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${r.status === 1 ? "bg-green-100 text-green-800" : r.status === 2 ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-800"}`}
                        >
                          {r.status === 1 ? "Active" : r.status === 2 ? "Deleted" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(r)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteMut.mutate({ id: r.id })}
                            disabled={r.status === 2}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{edit ? "Edit snack category" : "New snack category"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Khakhra" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort order</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
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
                      <Select value={String(field.value)} onValueChange={(v) => field.onChange(parseInt(v, 10))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Active (visible in store)</SelectItem>
                          <SelectItem value="0">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto bg-primary text-white" disabled={createMut.isPending || updateMut.isPending}>
                    Save
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
