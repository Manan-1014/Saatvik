import { useState } from "react";
import { Plus, Pencil, Trash2, Images } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAdminListGalleryItems,
  useCreateGalleryItem,
  useUpdateGalleryItem,
  useDeleteGalleryItem,
  getAdminListGalleryItemsQueryKey,
  getListGalleryItemsQueryKey,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  imageUrl: z.string().min(1, "Image URL required"),
  sortOrder: z.coerce.number().int().default(0),
  status: z.coerce.number().default(1),
});
type FormData = z.infer<typeof schema>;

export default function GalleryManagement() {
  const { data: rows, isLoading } = useAdminListGalleryItems();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [edit, setEdit] = useState<{ id: number } | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", imageUrl: "", sortOrder: 0, status: 1 },
  });

  const createMut = useCreateGalleryItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListGalleryItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListGalleryItemsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Photo added" });
      },
      onError: () => toast({ title: "Could not save", variant: "destructive" }),
    },
  });

  const updateMut = useUpdateGalleryItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListGalleryItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListGalleryItemsQueryKey() });
        setOpen(false);
        setEdit(null);
        form.reset();
        toast({ title: "Photo updated" });
      },
      onError: () => toast({ title: "Could not update", variant: "destructive" }),
    },
  });

  const deleteMut = useDeleteGalleryItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListGalleryItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListGalleryItemsQueryKey() });
        toast({ title: "Photo removed" });
      },
      onError: () => toast({ title: "Could not delete", variant: "destructive" }),
    },
  });

  function openModal(row?: any) {
    if (row) {
      setEdit({ id: row.id });
      form.reset({
        name: row.name,
        description: row.description || "",
        imageUrl: row.imageUrl || "",
        sortOrder: row.sortOrder ?? 0,
        status: row.status,
      });
    } else {
      setEdit(null);
      form.reset({ name: "", description: "", imageUrl: "", sortOrder: (rows?.length ?? 0) + 1, status: 1 });
    }
    setOpen(true);
  }

  function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder,
      status: data.status,
    };
    if (edit) {
      updateMut.mutate({ id: edit.id, data: payload });
    } else {
      createMut.mutate({ data: payload });
    }
  }

  return (
    <AdminLayout>
      <div data-testid="admin-gallery">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              <Images className="w-7 h-7 text-primary" />
              Gallery
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Add image URLs with a title and optional description.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add photo
          </Button>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-20">Preview</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Sort</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows?.map((r) => (
                    <tr key={r.id} className="border-t border-border/50">
                      <td className="px-4 py-2">
                        <img src={r.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover bg-muted" />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-[140px] truncate">{r.name}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{r.description || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.sortOrder}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${r.status === 1 ? "bg-green-100 text-green-800" : r.status === 2 ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-800"}`}
                        >
                          {r.status === 1 ? "Live" : r.status === 2 ? "Deleted" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(r)} disabled={r.status === 2}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate({ id: r.id })} disabled={r.status === 2}>
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{edit ? "Edit gallery photo" : "Add gallery photo"}</DialogTitle>
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
                        <Input {...field} placeholder="e.g. Festival thali setup" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none min-h-[80px]" {...field} placeholder="Short caption…" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://…" />
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
                      <FormLabel>Visibility</FormLabel>
                      <Select value={String(field.value)} onValueChange={(v) => field.onChange(parseInt(v, 10))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Published (visible on site)</SelectItem>
                          <SelectItem value="0">Hidden (draft)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white" disabled={createMut.isPending || updateMut.isPending}>
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
