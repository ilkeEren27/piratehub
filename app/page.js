export default function Home() {
  return (
    <main className="animate-fade-in">
      <section className="flex flex-col items-center justify-center my-20 md:my-40 px-4 relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Welcome to PirateHub!
          </h1>
          <p className="mt-4 text-lg md:text-xl py-10 max-w-2xl text-center text-foreground/90 leading-relaxed">
            I&apos;ve started building this campus-life app for Whitworth
            students with one main goal: create a digital campus community, a
            platform where students can connect with each other, discover
            events, and navigate Whitworth with ease.
          </p>
        </div>
      </section>
    </main>
  );
}
