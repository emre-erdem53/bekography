"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import {
  BEKOGRAPHY_MAP_ACCENT,
  BEKOGRAPHY_MAP_STYLES,
} from "@/lib/google-map-styles";
import {
  BEKOGRAPHY_COORDINATES,
  BEKOGRAPHY_MAPS_LABEL,
  BEKOGRAPHY_MAPS_SHORT_URL,
  getBekographyMapsEmbedUrl,
  getGoogleMapsApiKey,
  getGooglePlaceId,
} from "@/lib/site-location";

type BekographyMapProps = {
  className?: string;
  title?: string;
};

let mapsOptionsConfigured = false;

function buildMarkerContent() {
  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col items-center gap-1";
  wrapper.style.transform = "translateY(-4px)";

  const pin = document.createElement("div");
  pin.className = "flex items-center justify-center rounded-full shadow-lg";
  pin.style.width = "42px";
  pin.style.height = "42px";
  pin.style.backgroundColor = BEKOGRAPHY_MAP_ACCENT;
  pin.style.boxShadow = "0 8px 24px rgba(0,0,0,0.45)";

  const dot = document.createElement("span");
  dot.style.width = "10px";
  dot.style.height = "10px";
  dot.style.borderRadius = "9999px";
  dot.style.backgroundColor = "#09090b";
  pin.appendChild(dot);

  const label = document.createElement("span");
  label.textContent = BEKOGRAPHY_MAPS_LABEL;
  label.style.fontSize = "11px";
  label.style.fontWeight = "600";
  label.style.letterSpacing = "0.14em";
  label.style.textTransform = "lowercase";
  label.style.color = "#fafafa";
  label.style.textShadow = "0 1px 8px rgba(0,0,0,0.85)";

  const stem = document.createElement("div");
  stem.style.width = "2px";
  stem.style.height = "10px";
  stem.style.marginTop = "-2px";
  stem.style.backgroundColor = BEKOGRAPHY_MAP_ACCENT;

  wrapper.append(pin, stem, label);
  return wrapper;
}

export function BekographyMap({
  className = "h-full w-full",
  title = "bekography ofis konumu",
}: BekographyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallbackEmbed, setUseFallbackEmbed] = useState(false);

  const apiKey = getGoogleMapsApiKey();
  const placeId = getGooglePlaceId();
  const embedUrl = getBekographyMapsEmbedUrl({ apiKey, placeId });

  useEffect(() => {
    if (!apiKey || !containerRef.current) {
      setUseFallbackEmbed(true);
      return;
    }

    let cancelled = false;

    if (!mapsOptionsConfigured) {
      setOptions({
        key: apiKey,
        v: "weekly",
        language: "tr",
        region: "TR",
      });
      mapsOptionsConfigured = true;
    }

    Promise.all([importLibrary("maps"), importLibrary("marker")])
      .then(([mapsLib, markerLib]) => {
        if (cancelled || !containerRef.current) return;

        const { Map } = mapsLib;
        const { AdvancedMarkerElement } = markerLib;

        const map = new Map(containerRef.current, {
          center: BEKOGRAPHY_COORDINATES,
          zoom: 17,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          styles: BEKOGRAPHY_MAP_STYLES,
        });

        new AdvancedMarkerElement({
          map,
          position: BEKOGRAPHY_COORDINATES,
          title: BEKOGRAPHY_MAPS_LABEL,
          content: buildMarkerContent(),
        });
      })
      .catch(() => {
        if (!cancelled) setUseFallbackEmbed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  if (useFallbackEmbed) {
    return (
      <iframe
        title={title}
        src={embedUrl}
        className={className}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      <a
        href={BEKOGRAPHY_MAPS_SHORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm transition hover:bg-black/90"
      >
        Google Maps
      </a>
    </div>
  );
}
