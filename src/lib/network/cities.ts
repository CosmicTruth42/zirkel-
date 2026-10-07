import type { Region } from "./types";

export type City = {
  name: string;
  lat: number;
  lng: number;
  region: Region;
};

export const CITIES: City[] = [
  { name: "München", lat: 48.14, lng: 11.58, region: "süd" },
  { name: "Augsburg", lat: 48.37, lng: 10.9, region: "süd" },
  { name: "Kempten", lat: 47.72, lng: 10.32, region: "süd" },
  { name: "Passau", lat: 48.57, lng: 13.43, region: "süd" },
  { name: "Regensburg", lat: 49.01, lng: 12.1, region: "süd" },
  { name: "Nürnberg", lat: 49.45, lng: 11.08, region: "süd" },
  { name: "Würzburg", lat: 49.79, lng: 9.95, region: "süd" },
  { name: "Stuttgart", lat: 48.78, lng: 9.18, region: "süd" },
  { name: "Ulm", lat: 48.4, lng: 9.99, region: "süd" },
  { name: "Freiburg", lat: 47.99, lng: 7.85, region: "süd" },
  { name: "Karlsruhe", lat: 49.01, lng: 8.4, region: "süd" },
  { name: "Heidelberg", lat: 49.4, lng: 8.68, region: "mitte" },
  { name: "Frankfurt", lat: 50.11, lng: 8.68, region: "mitte" },
  { name: "Mainz", lat: 49.99, lng: 8.27, region: "mitte" },
  { name: "Köln", lat: 50.94, lng: 6.96, region: "west" },
  { name: "Düsseldorf", lat: 51.23, lng: 6.78, region: "west" },
  { name: "Aachen", lat: 50.78, lng: 6.08, region: "west" },
  { name: "Dortmund", lat: 51.51, lng: 7.47, region: "west" },
  { name: "Münster", lat: 51.96, lng: 7.63, region: "west" },
  { name: "Bielefeld", lat: 52.03, lng: 8.53, region: "west" },
  { name: "Hannover", lat: 52.37, lng: 9.73, region: "mitte" },
  { name: "Bremen", lat: 53.08, lng: 8.8, region: "nord" },
  { name: "Hamburg", lat: 53.55, lng: 9.99, region: "nord" },
  { name: "Kiel", lat: 54.32, lng: 10.14, region: "nord" },
  { name: "Lübeck", lat: 53.87, lng: 10.69, region: "nord" },
  { name: "Rostock", lat: 54.09, lng: 12.14, region: "nord" },
  { name: "Berlin", lat: 52.52, lng: 13.4, region: "ost" },
  { name: "Potsdam", lat: 52.4, lng: 13.06, region: "ost" },
  { name: "Leipzig", lat: 51.34, lng: 12.37, region: "ost" },
  { name: "Dresden", lat: 51.05, lng: 13.74, region: "ost" },
  { name: "Magdeburg", lat: 52.13, lng: 11.63, region: "ost" },
  { name: "Erfurt", lat: 50.98, lng: 11.03, region: "ost" },
  { name: "Saarbrücken", lat: 49.23, lng: 7.0, region: "west" },
];

export const REGION_LABEL: Record<Region, string> = {
  süd: "Süden",
  west: "Westen",
  nord: "Norden",
  ost: "Osten",
  mitte: "Mitte",
};

export function findCity(name: string): City | undefined {
  const n = name.trim().toLowerCase();
  return CITIES.find((c) => c.name.toLowerCase() === n);
}

export function cityOrFallback(name: string): City {
  return (
    findCity(name) ?? {
      name: name.trim() || "Unbekannt",
      lat: 51.16,
      lng: 10.45,
      region: "mitte",
    }
  );
}

/** lng/lat ring, clockwise from the North Sea. Simplified outline. */
export const GERMANY_RING: [number, number][] = [
  [7.0, 53.7],
  [8.0, 53.9],
  [8.6, 54.5],
  [8.9, 54.83],
  [9.5, 54.8],
  [10.2, 54.5],
  [10.4, 54.4],
  [11.1, 54.4],
  [12.1, 54.3],
  [12.9, 54.4],
  [13.6, 54.4],
  [13.8, 53.9],
  [14.3, 53.7],
  [14.4, 53.4],
  [14.2, 52.9],
  [14.4, 52.5],
  [14.6, 52.35],
  [14.4, 51.9],
  [14.9, 51.4],
  [14.7, 51.0],
  [14.83, 50.87],
  [14.3, 50.4],
  [12.9, 50.4],
  [12.5, 50.2],
  [12.8, 49.6],
  [13.6, 48.7],
  [13.83, 48.52],
  [13.0, 47.5],
  [12.8, 47.7],
  [12.2, 47.58],
  [11.0, 47.5],
  [10.47, 47.4],
  [10.18, 47.27],
  [9.66, 47.55],
  [8.7, 47.58],
  [7.66, 47.54],
  [7.49, 47.58],
  [7.59, 48.3],
  [7.81, 48.58],
  [8.15, 48.97],
  [7.56, 49.05],
  [6.53, 49.46],
  [6.14, 49.46],
  [6.36, 49.91],
  [6.12, 50.13],
  [6.08, 50.87],
  [6.02, 51.05],
  [5.87, 51.85],
  [6.2, 51.87],
  [6.75, 51.99],
  [7.08, 52.4],
  [6.62, 52.66],
  [6.75, 53.35],
  [7.0, 53.7],
];

export const GEO_BOUNDS = {
  minLng: 5.7,
  maxLng: 15.2,
  minLat: 47.2,
  maxLat: 55.1,
};

export function projectGeo(
  lng: number,
  lat: number,
  width: number,
  height: number,
  pad = 28,
) {
  const { minLng, maxLng, minLat, maxLat } = GEO_BOUNDS;
  const x = pad + ((lng - minLng) / (maxLng - minLng)) * (width - pad * 2);
  const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (height - pad * 2);
  return { x, y };
}
