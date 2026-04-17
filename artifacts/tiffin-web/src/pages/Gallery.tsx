import { Navbar } from "@/components/Navbar";
import { useListGalleryItems } from "@workspace/api-client-react";
import { Images } from "lucide-react";

export default function Gallery() {
  const { data: items, isLoading } = useListGalleryItems();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-primary font-semibold mb-2">
            <Images className="w-6 h-6" />
            <span className="uppercase tracking-wider text-sm">Gallery</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
            Kitchen, food &amp; events
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            A glimpse of our kitchen, thalis, and celebrations. Images are curated by our team from the links we add here.
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-muted" />
            ))}
          </div>
        ) : !items?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center text-muted-foreground">
            No photos in the gallery yet. Check back soon.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <article
                key={item.id}
                className="group bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h2 className="font-semibold text-lg text-foreground mb-1">{item.name}</h2>
                  {item.description ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
