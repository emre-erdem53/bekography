type MapStyle = {
  elementType?: string;
  featureType?: string;
  stylers: Array<Record<string, string | number>>;
};

/** Dark map skin aligned with bekography site palette (zinc-950 base, muted labels). */
export const BEKOGRAPHY_MAP_STYLES: MapStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a1a1aa" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#111113" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#18181b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#27272a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1f1f23" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3f3f46" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#18181b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0c0c0e" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#52525b" }],
  },
];

export const BEKOGRAPHY_MAP_ACCENT = "#93f8b6";
