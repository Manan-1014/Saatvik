import { useEffect } from "react";
import { Clock, Settings2, Bell, Building2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  order_cutoff_time: z.string().optional(),
  maintenance_mode: z.boolean().default(false),
  announcement: z.string().optional(),
  business_name: z.string().optional(),
  contact_number: z.string().optional(),
});
type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { data: settings } = useGetSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      order_cutoff_time: "",
      maintenance_mode: false,
      announcement: "",
      business_name: "",
      contact_number: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        order_cutoff_time: settings.order_cutoff_time || "",
        maintenance_mode: settings.maintenance_mode ?? false,
        announcement: settings.announcement || "",
        business_name: settings.business_name || "",
        contact_number: settings.contact_number || "",
      });
    }
  }, [settings, form]);

  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        toast({ title: "Settings saved!" });
      },
      onError: () => toast({ title: "Error saving settings", variant: "destructive" }),
    }
  });

  return (
    <AdminLayout>
      <div data-testid="admin-settings">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your application settings</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => updateSettings.mutate({ data }))} className="space-y-6 max-w-2xl">
            {/* Cutoff Time */}
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Order Cutoff Time</h3>
                  <p className="text-sm text-muted-foreground mb-4">Orders received after this time will be processed the next day</p>
                  <FormField control={form.control} name="order_cutoff_time" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="time" className="w-40" {...field} data-testid="input-cutoff-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Maintenance Mode</h3>
                  <p className="text-sm text-muted-foreground">Enable maintenance mode to temporarily disable new orders</p>
                </div>
                <FormField control={form.control} name="maintenance_mode" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="toggle-maintenance" />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Announcement */}
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Custom Announcement Banner</h3>
                  <p className="text-sm text-muted-foreground mb-4">Display a custom message on the homepage (leave empty to disable)</p>
                  <FormField control={form.control} name="announcement" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Enter announcement message (leave empty to disable)" className="resize-none h-24" {...field} data-testid="input-announcement" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-4">Business Information</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="business_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl><Input placeholder="Saatvik Jain Aahar Gruh" {...field} data-testid="input-business-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="contact_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl><Input placeholder="+91 98765 43210" {...field} data-testid="input-contact-number" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8" disabled={updateSettings.isPending} data-testid="btn-save-settings">
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
