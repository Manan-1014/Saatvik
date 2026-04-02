import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, MessageSquare, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Navbar } from "@/components/Navbar";
import { useSubmitContact, useListDeliveryAreas, useGetSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email").optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const { data: settings } = useGetSettings();
  const { data: areas } = useListDeliveryAreas();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", email: "", message: "" },
  });

  const submitContact = useSubmitContact({
    mutation: {
      onSuccess: () => {
        toast({ title: "Message sent!", description: "We will get back to you shortly on WhatsApp." });
        form.reset();
      },
      onError: () => toast({ title: "Error", description: "Failed to send message.", variant: "destructive" }),
    }
  });

  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      content: settings?.contact_number || "+91 98765 43210",
      sub: "Mon - Sun, 9 AM - 8 PM",
      link: `tel:${settings?.contact_number || "+919876543210"}`,
      linkLabel: "Call Now",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp",
      content: settings?.contact_number || "+91 98765 43210",
      sub: "Quick replies on WhatsApp",
      link: `https://wa.me/919876543210`,
      linkLabel: "Chat Now",
    },
    {
      icon: MapPin,
      title: "Our Kitchen",
      content: "12, Panchvati Society",
      sub: "Vastrapur, Ahmedabad - 380 015",
      link: "https://maps.google.com/?q=Vastrapur+Ahmedabad",
      linkLabel: "Get Directions",
    },
    {
      icon: Clock,
      title: "Delivery Hours",
      content: "Lunch: 11 AM - 2 PM",
      sub: "Nasta: 4 PM - 7 PM",
      link: null,
      linkLabel: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Contact Us</h1>
          <p className="text-muted-foreground">Have a question, want a monthly subscription, or just want to say hello? Reach out — we reply within a few hours on WhatsApp.</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {contactInfo.map(info => (
            <div key={info.title} className="bg-card border border-card-border rounded-2xl p-5" data-testid={`contact-card-${info.title.toLowerCase().replace(" ", "-")}`}>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <info.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{info.title}</h3>
              <p className="text-sm text-foreground">{info.content}</p>
              <p className="text-xs text-muted-foreground">{info.sub}</p>
              {info.link && (
                <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium mt-2 block hover:underline" data-testid={`link-${info.title.toLowerCase().replace(" ", "-")}`}>
                  {info.linkLabel} →
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Send Us a Message</h2>
            <p className="text-sm text-muted-foreground mb-6">For subscriptions, bulk orders, or any queries — fill the form below.</p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(data => submitContact.mutate({ data: { ...data, email: data.email || undefined } }))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} data-testid="input-contact-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" {...field} data-testid="input-contact-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} data-testid="input-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your query — subscription plans, bulk orders, special requests..."
                          className="h-32 resize-none"
                          {...field}
                          data-testid="input-contact-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={submitContact.isPending}
                  data-testid="btn-submit-contact"
                >
                  {submitContact.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Map & Delivery Areas */}
          <div className="space-y-6">
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3672.2!2d72.535!3d23.027!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDAxJzM3LjIiTiA3MsKwMzInMDYuMCJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Kitchen Location"
                data-testid="map-kitchen"
              />
              <div className="p-4">
                <p className="font-medium text-foreground text-sm">12, Panchvati Society</p>
                <p className="text-xs text-muted-foreground">Vastrapur, Ahmedabad - 380 015</p>
                <a href="https://maps.google.com/?q=Vastrapur+Ahmedabad" target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium mt-1 block hover:underline">
                  Open in Google Maps →
                </a>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Delivery Areas</h3>
              <div className="flex flex-wrap gap-2">
                {areas?.map(area => (
                  <span key={area.id} className="bg-secondary text-foreground text-xs px-3 py-1.5 rounded-full border border-border" data-testid={`delivery-area-${area.id}`}>
                    {area.name} · &#x20B9;{area.delivery_charge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
