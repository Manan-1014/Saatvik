import { cn } from "@/lib/utils";

export const BRAND_LOGO_ALT =
  "Pure Jain Satvik Ahar Gruh — traditional Jain vegetarian meals, chef hat and thali";

const logoSrc = `${import.meta.env.BASE_URL}brand-logo.png`;

type BrandLogoProps = {
  className?: string;
};

/**
 * Official circular brand mark — navbar, footer, admin shell, auth cards; same asset as favicon.
 */
export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      src={logoSrc}
      alt={BRAND_LOGO_ALT}
      className={cn("object-contain rounded-full select-none shrink-0", className)}
      decoding="async"
    />
  );
}
