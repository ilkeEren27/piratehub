"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  MarkerClustererF,
  CircleF,
} from "@react-google-maps/api";
import { categories, places, colors } from "@/data/places";
import { pinIcon } from "@/lib/mapIcons";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";

const MAP_CENTER = { lat: 47.7531493070487, lng: -117.41635063409184 };
const DEFAULT_ZOOM = 17;

// Map styling rules (kept minimal): hide building/POI labels without changing base map colors.
const MAP_LABEL_HIDE_STYLES = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

export default function CampusMap() {
  const [selectedCats, setSelectedCats] = useState(new Set(categories));
  const [logic, setLogic] = useState("ANY");
  const [activeId, setActiveId] = useState(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [mapInstance, setMapInstance] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 👇 new: user position + accuracy
  const [userPos, setUserPos] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    const id = searchParams?.get("id");
    if (id) setActiveId(id);
  }, [searchParams]);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Filter places based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return places.filter((place) =>
      place.name.toLowerCase().includes(query)
    ).slice(0, 8); // Limit to 8 results
  }, [searchQuery]);

  // Handle clicking on a search result
  const handleSelectPlace = useCallback((place) => {
    setActiveId(place.id);
    setSearchQuery("");
    setShowResults(false);
    if (mapInstance) {
      mapInstance.panTo({ lat: place.lat, lng: place.lng });
      mapInstance.setZoom(18); // Zoom in on the selected location
    }
  }, [mapInstance]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detect dark mode and listen for changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    // Check initial state
    checkDarkMode();

    // Watch for changes using MutationObserver
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // get user location once on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
      },
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  const matches = useCallback(
    (place) => {
      if (selectedCats.size === 0) return true;
      const has = (c) => selectedCats.has(c);
      const hits = place.categories.filter(has).length;
      return logic === "ANY"
        ? hits > 0
        : [...selectedCats].every((c) => place.categories.includes(c));
    },
    [selectedCats, logic]
  );

  const markers = useMemo(() => places.filter(matches), [matches]);

  const toggleCat = (cat) => {
    setSelectedCats((prev) => {
      const n = new Set(prev);
      n.has(cat) ? n.delete(cat) : n.add(cat);
      return n;
    });
  };

  const onLoad = useCallback(
    (map) => {
      setMapInstance(map);
      if (!markers.length) return;
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, 80);
      window.google.maps.event.addListenerOnce(map, "idle", () => {
        map.setZoom(zoom);
      });
    },
    [markers, zoom]
  );

  const handleZoomChanged = () => {
    if (mapInstance) {
      setZoom(mapInstance.getZoom());
    }
  };

  // Create dynamic map options based on dark mode
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      clickableIcons: false,
      gestureHandling: "greedy",
      fullscreenControl: false,
      styles: MAP_LABEL_HIDE_STYLES,
    }),
    []
  );

  return (
    <div className="w-full h-[calc(100dvh-72px)] grid grid-rows-[auto_auto_auto_1fr] sm:rounded-xl overflow-hidden bg-background sm:shadow-lg">
      {/* Search bar */}
      <div className="p-2 sm:p-3 relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {/* Search icon */}
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute left-2 right-2 sm:left-3 sm:right-3 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            {searchResults.map((place) => (
              <button
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center justify-between gap-2"
              >
                <span className="font-medium text-foreground">{place.name}</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {place.categories.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: colors[cat] || "var(--border)",
                        color: colors[cat] || "var(--foreground)",
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
        {/* No results message */}
        {showResults && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute left-2 right-2 sm:left-3 sm:right-3 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 px-4 py-3 text-muted-foreground text-sm">
            No locations found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="p-2 sm:p-3 flex gap-2 flex-wrap backdrop-blur">
        {categories.map((c) => {
          const on = selectedCats.has(c);
          return (
            <Button
              key={c}
              onClick={() => toggleCat(c)}
              className={`px-2.5 py-1 rounded-2xl border text-xs sm:text-sm transition
                ${
                  on
                    ? "bg-primary text-primary-foreground border-primary dark:border-primary"
                    : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border dark:bg-card dark:text-foreground dark:border-border"
                }`}
              title={c}
            >
              {c}
            </Button>
          );
        })}
        <Button
          onClick={() => setSelectedCats(new Set(categories))}
          className="ml-auto px-2.5 py-1 rounded-2xl border text-xs sm:text-sm bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border dark:bg-card dark:text-foreground dark:border-border"
        >
          All
        </Button>
        <Button
          onClick={() => setSelectedCats(new Set())}
          className="px-2.5 py-1 rounded-2xl border text-xs sm:text-sm bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border dark:bg-card dark:text-foreground dark:border-border"
        >
          None
        </Button>
      </div>

      {/* ANY / ALL logic toggle */}
      <div className="px-2 sm:px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm text-muted-foreground">
          Filter logic:
        </span>
        <div className="flex gap-2">
          <Button
            onClick={() => setLogic("ANY")}
            className={`px-2.5 py-1 rounded-2xl border text-xs sm:text-sm transition ${
              logic === "ANY"
                ? "bg-primary text-primary-foreground border-primary dark:border-primary"
                : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border dark:bg-card dark:text-foreground dark:border-border"
            }`}
          >
            Any (Match at least one)
          </Button>
          <Button
            onClick={() => setLogic("ALL")}
            className={`px-2.5 py-1 rounded-2xl border text-xs sm:text-sm transition ${
              logic === "ALL"
                ? "bg-primary text-primary-foreground border-primary dark:border-primary"
                : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border dark:bg-card dark:text-foreground dark:border-border"
            }`}
          >
            All (Must match all)
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="relative w-full h-full min-h-[300px] sm:min-h-0">
        <GoogleMap
          onLoad={onLoad}
          onZoomChanged={handleZoomChanged}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={MAP_CENTER}
          zoom={zoom}
          options={mapOptions}
        >
          <MarkerClustererF averageCenter enableRetinaIcons gridSize={50}>
            {(clusterer) =>
              markers.map((p) => (
                <MarkerF
                  key={p.id}
                  position={{ lat: p.lat, lng: p.lng }}
                  clusterer={clusterer}
                  icon={pinIcon(p.categories, colors)}
                  onClick={() => setActiveId(p.id)}
                />
              ))
            }
          </MarkerClustererF>

          {/* Info windows */}
          {markers.map((p) =>
            p.id === activeId ? (
              <InfoWindowF
                key={`iw-${p.id}`}
                position={{ lat: p.lat, lng: p.lng }}
                onCloseClick={() => setActiveId(null)}
                options={{ pixelOffset: new google.maps.Size(0, -8) }}
              >
                <div className="space-y-2 text-foreground">
                  <div className="font-bold text-card-foreground">{p.name}</div>
                  <div className="flex gap-2 flex-wrap">
                    {p.categories.map((c) => (
                      <span
                        key={c}
                        className="rounded-md p-1 text-xs border border-border bg-card font-medium"
                        style={
                          colors?.[c]
                            ? {
                                borderColor: colors[c],
                                color: colors[c],
                              }
                            : undefined
                        }
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {p.desc && (
                    <div className="text-sm text-card-foreground font-normal">
                      {p.desc}
                    </div>
                  )}
                </div>
              </InfoWindowF>
            ) : null
          )}

          {/* 👇 User marker + accuracy circle */}
          {userPos && (
            <>
              <MarkerF
                position={userPos}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: isDarkMode ? "#d96b6a" : "#bf4342", // Primary color - theme aware
                  fillOpacity: 1,
                  strokeColor: isDarkMode ? "#2d1b1a" : "#ffffff",
                  strokeWeight: 2,
                }}
              />
              <CircleF
                center={userPos}
                radius={accuracy || 15} // Use GPS accuracy for radius, fallback to 15m
                options={{
                  fillColor: isDarkMode ? "#d96b6a" : "#bf4342", // Primary color - theme aware
                  fillOpacity: 0.15,
                  strokeColor: isDarkMode ? "#d96b6a" : "#bf4342",
                  strokeOpacity: 0.4,
                  strokeWeight: 1,
                  clickable: false,
                }}
              />
            </>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
