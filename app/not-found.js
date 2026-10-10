import Link from "next/link";
import "./globals.css";

// Shown only for requests that never got a locale (the proxy adds one to
// almost everything), so it renders outside app/[locale]/layout.js — which
// means it needs its own <html>/<body> and can't use translations. Both
// languages are shown instead.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex items-center justify-center">
        <main className="flex flex-col items-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">
            This page doesn’t exist · Esta página no existe
          </h1>
          <div className="flex gap-3">
            <Link href="/en" className="text-primary underline">
              Take me home
            </Link>
            <Link href="/es" className="text-primary underline">
              Volver al inicio
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
