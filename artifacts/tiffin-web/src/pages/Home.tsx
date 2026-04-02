import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Clock, Star, Leaf, ChefHat, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useGetSettings } from "@workspace/api-client-react";

export default function Home() {
  const { data: settings } = useGetSettings();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Announcement Banner */}
      {settings?.announcement && (
        <div className="bg-green-600 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2" data-testid="announcement-banner">
          <Clock className="w-4 h-4" />
          <span>{settings.announcement}</span>
        </div>
      )}

      {/* Hero Section */}
      <section
        className="relative min-h-[80vh] flex items-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.2) 100%), url('https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        data-testid="hero-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-4 py-2 rounded-full mb-6">
              <Leaf className="w-3.5 h-3.5 text-green-400" />
              Pure Jain - No Onion - No Garlic
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              Saatvik Jain
            </h1>
            <h2 className="text-4xl lg:text-5xl font-bold text-primary mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Aahar Gruh
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Authentic, home-style Jain meals — freshly cooked and delivered to your doorstep every day. No login. No fuss. Just wholesome food.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/menu">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-8" data-testid="btn-order-now">
                  Order Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/menu">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent" data-testid="btn-view-menu">
                  View Menu
                </Button>
              </Link>
            </div>
            <div className="flex gap-8">
              {[
                { value: "500+", label: "Happy Families" },
                { value: "6+", label: "Years of Service" },
                { value: "100%", label: "Jain Certified" },
              ].map(stat => (
                <div key={stat.label} data-testid={`stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">WHY CHOOSE US</div>
            <h2 className="text-4xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Pure Food. Pure Values.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Leaf, title: "100% Jain Food", desc: "No onion, no garlic, no root vegetables. Pure Jain recipes prepared with love and tradition." },
              { icon: ChefHat, title: "Home-Style Cooking", desc: "Every meal is freshly prepared each day using traditional Jain recipes passed down for generations." },
              { icon: Heart, title: "Delivered With Care", desc: "Hot, fresh meals delivered to your doorstep. Because every family deserves nutritious, authentic food." },
            ].map(item => (
              <div key={item.title} className="bg-card border border-card-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow" data-testid={`feature-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">OUR PROMISE</div>
              <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                Freshly Cooked,<br />Every Single Day
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We prepare every item fresh daily — no pre-cooking, no reheating. Just wholesome Jain food delivered hot to your doorstep.
              </p>
              {[
                { icon: ShieldCheck, text: "Strictly no onion, garlic, or root vegetables" },
                { icon: Clock, text: "Fresh preparation starts at 7 AM every day" },
                { icon: Star, text: "Trusted by 500+ families across Ahmedabad" },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
              ))}
              <div className="mt-8">
                <Link to="/menu">
                  <Button className="bg-primary hover:bg-primary/90 text-white" data-testid="btn-explore-menu">
                    Explore Our Menu <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80"
                alt="Jain thali"
                className="w-full h-80 object-cover"
                data-testid="img-thali"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Ready for a wholesome Jain meal?</h2>
          <p className="text-white/80 mb-8">Order now and get fresh Jain food delivered to your home today.</p>
          <Link to="/menu">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" data-testid="btn-cta-order">
              Order Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white/60 py-8 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Saatvik Jain Aahar Gruh. All rights reserved. | 12, Panchvati Society, Vastrapur, Ahmedabad - 380 015</p>
        </div>
      </footer>
    </div>
  );
}
