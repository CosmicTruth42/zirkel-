export const CIRCLE_HUES = [
  "sage",
  "slate",
  "clay",
  "pine",
  "stone",
  "dusk",
  "moss",
  "umber",
] as const;

export type CircleHue = (typeof CIRCLE_HUES)[number];

export const VALUE_TAGS = [
  "Freiheit",
  "Verantwortung",
  "Handwerk",
  "Familie",
  "Natur",
  "Bildung",
  "Unabhängigkeit",
  "Stille",
  "Mut",
  "Bodenständigkeit",
] as const;

export type ValueTag = (typeof VALUE_TAGS)[number];

export const PROFESSIONS = [
  "Anwalt",
  "Arzt",
  "Hebamme",
  "Lehre",
  "Handwerk",
  "Landwirtschaft",
  "Verlag",
  "Gastronomie",
  "Seefahrt",
  "Handel",
  "Technik",
  "Beratung",
] as const;

export type Region = "süd" | "west" | "nord" | "ost" | "mitte";

export type Person = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  region: Region;
  values: string[];
  note: string;
  addedAt: number;
  isYou?: boolean;
  profession?: string;
  email?: string;
  phone?: string;
};

export type Circle = {
  id: string;
  name: string;
  hue: CircleHue;
  memberIds: string[];
  formedAt: number;
  note: string;
};

export type Destination =
  | { kind: "person"; id: string }
  | { kind: "city"; city: string }
  | { kind: "profession"; profession: string };

export type ViewId = "netz" | "karte" | "kreise";

export type NetworkState = {
  people: Person[];
  circles: Circle[];
};

export type InvitePerson = {
  name: string;
  city: string;
  profession?: string;
  values: string[];
  note?: string;
  email?: string;
};

export type InvitePayload = {
  v: 1;
  from: string;
  person: InvitePerson;
  circle?: { name: string; note?: string };
};
