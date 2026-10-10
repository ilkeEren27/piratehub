import { notFound } from "next/navigation";

// Any address that matches no page lands here, so it gets the translated
// app/[locale]/not-found.js inside the normal layout.
export default function CatchAllPage() {
  notFound();
}
