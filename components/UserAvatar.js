import { cn } from "@/lib/utils";

const SIZES = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-9 w-9 text-sm",
  lg: "h-20 w-20 text-2xl",
};

// Round user avatar with a gradient-initial fallback (same look as the
// old navbar initial circle). Plain <img> so Blob URLs need no config.
export default function UserAvatar({ name, image, size = "md", className }) {
  const sizeClasses = SIZES[size] ?? SIZES.md;

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || "avatar"}
        className={cn(
          "rounded-full object-cover shrink-0 border border-border/50",
          sizeClasses,
          className
        )}
      />
    );
  }

  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center shrink-0 select-none",
        sizeClasses,
        className
      )}
    >
      {initial}
    </span>
  );
}
