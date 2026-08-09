// Shared page header — every top-level page uses this so titles and
// descriptions look identical across the site. Content sections below the
// header should use PAGE_MARGIN for the same horizontal alignment.
export const PAGE_MARGIN = "mx-6 sm:mx-12 lg:mx-20";

export default function PageHeader({ title, description, children }) {
  return (
    <section
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-12 md:mt-16 ${PAGE_MARGIN}`}
    >
      <div>
        <h1 className="text-4xl md:text-5xl font-bold pb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-lg text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
