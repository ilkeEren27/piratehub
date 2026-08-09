"use client";

import CampusMap from "@/components/map/CampusMap";
import PageHeader, { PAGE_MARGIN } from "@/components/PageHeader";
import { useJsApiLoader } from "@react-google-maps/api";
import { useTranslations } from "next-intl";

export default function MapPage() {
  const t = useTranslations("map");

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: [],
  });

  return (
    <main className="animate-fade-in">
      <PageHeader title={t("title")} description={t("description")} />
      <section className={`mt-10 mb-16 ${PAGE_MARGIN}`}>
        {loadError ? (
          <div className="p-6">{t("loadError")}</div>
        ) : !isLoaded ? (
          <div className="p-6">{t("loading")}</div>
        ) : (
          <CampusMap />
        )}
      </section>
    </main>
  );
}
