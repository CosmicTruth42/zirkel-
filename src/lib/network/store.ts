import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cityOrFallback } from "./cities";
import { emptyNetwork, SEED_NETWORK, YOU_PERSON_ID } from "./seed";
import { samePerson } from "./invite";
import type {
  Circle,
  CircleHue,
  Destination,
  InvitePayload,
  NetworkState,
  Person,
  ViewId,
} from "./types";
import { CIRCLE_HUES } from "./types";
import { uid } from "../utils";

type AddPersonInput = {
  name: string;
  city: string;
  values: string[];
  note: string;
  profession?: string;
  email?: string;
  phone?: string;
};

type AddCircleInput = {
  name: string;
  note: string;
  memberIds: string[];
};

type NetworkStore = NetworkState & {
  seenIntro: boolean;
  view: ViewId;
  selectedPersonId: string | null;
  selectedCircleId: string | null;
  destination: Destination | null;
  valueFilter: string | null;
  search: string;
  dismissIntro: () => void;
  setView: (v: ViewId) => void;
  selectPerson: (id: string | null) => void;
  selectCircle: (id: string | null) => void;
  setDestination: (d: Destination | null) => void;
  setValueFilter: (v: string | null) => void;
  setSearch: (q: string) => void;
  loadSeed: () => void;
  resetEmpty: () => void;
  addPerson: (input: AddPersonInput) => string;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  removePerson: (id: string) => void;
  addCircle: (input: AddCircleInput) => string | { error: string };
  updateCircle: (id: string, patch: Partial<Circle>) => void;
  removeCircle: (id: string) => void;
  importInvite: (payload: InvitePayload) => string;
};

function nextHue(existing: Circle[]): CircleHue {
  const used = new Set(existing.map((c) => c.hue));
  return CIRCLE_HUES.find((h) => !used.has(h)) ?? CIRCLE_HUES[existing.length % CIRCLE_HUES.length]!;
}

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set, get) => ({
      ...SEED_NETWORK,
      seenIntro: false,
      view: "netz",
      selectedPersonId: YOU_PERSON_ID,
      selectedCircleId: null,
      destination: null,
      valueFilter: null,
      search: "",
      dismissIntro: () => set({ seenIntro: true }),
      setView: (v) => set({ view: v }),
      selectPerson: (id) =>
        set({ selectedPersonId: id, selectedCircleId: id ? null : get().selectedCircleId }),
      selectCircle: (id) =>
        set({ selectedCircleId: id, selectedPersonId: id ? null : get().selectedPersonId }),
      setDestination: (d) => set({ destination: d }),
      setValueFilter: (v) => set({ valueFilter: v }),
      setSearch: (q) => set({ search: q }),
      loadSeed: () =>
        set({
          ...SEED_NETWORK,
          selectedPersonId: YOU_PERSON_ID,
          selectedCircleId: null,
          destination: null,
        }),
      resetEmpty: () =>
        set({
          ...emptyNetwork(),
          selectedPersonId: YOU_PERSON_ID,
          selectedCircleId: null,
          destination: null,
        }),
      addPerson: (input) => {
        const city = cityOrFallback(input.city);
        const person: Person = {
          id: uid("p"),
          name: input.name.trim(),
          city: city.name,
          lat: city.lat,
          lng: city.lng,
          region: city.region,
          values: input.values,
          note: input.note.trim(),
          profession: input.profession?.trim() ?? "",
          email: input.email?.trim() ?? "",
          phone: input.phone?.trim() ?? "",
          addedAt: Date.now(),
        };
        set({ people: [...get().people, person], selectedPersonId: person.id });
        return person.id;
      },
      updatePerson: (id, patch) => {
        set({
          people: get().people.map((p) => {
            if (p.id !== id) return p;
            const next = { ...p, ...patch };
            if (patch.city) {
              const city = cityOrFallback(patch.city);
              next.city = city.name;
              next.lat = city.lat;
              next.lng = city.lng;
              next.region = city.region;
            }
            return next;
          }),
        });
      },
      removePerson: (id) => {
        const person = get().people.find((p) => p.id === id);
        if (!person || person.isYou) return;
        set({
          people: get().people.filter((p) => p.id !== id),
          circles: get()
            .circles.map((c) => ({
              ...c,
              memberIds: c.memberIds.filter((m) => m !== id),
            }))
            .filter((c) => c.memberIds.length >= 2),
          selectedPersonId:
            get().selectedPersonId === id ? YOU_PERSON_ID : get().selectedPersonId,
        });
      },
      addCircle: (input) => {
        const members = [...new Set(input.memberIds)];
        if (members.length < 3 || members.length > 5) {
          return { error: "Ein Kreis hat 3 bis 5 Menschen." };
        }
        const circle: Circle = {
          id: uid("c"),
          name: input.name.trim() || "Neuer Kreis",
          hue: nextHue(get().circles),
          memberIds: members,
          formedAt: Date.now(),
          note: input.note.trim(),
        };
        set({ circles: [...get().circles, circle], selectedCircleId: circle.id });
        return circle.id;
      },
      updateCircle: (id, patch) => {
        if (patch.memberIds) {
          const n = new Set(patch.memberIds).size;
          if (n < 3 || n > 5) return;
        }
        set({
          circles: get().circles.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        });
      },
      removeCircle: (id) => {
        set({
          circles: get().circles.filter((c) => c.id !== id),
          selectedCircleId: get().selectedCircleId === id ? null : get().selectedCircleId,
        });
      },
      importInvite: (payload) => {
        const existing = get().people.find((p) => samePerson(p, payload.person));
        if (existing) {
          set({ selectedPersonId: existing.id, destination: null });
          return existing.id;
        }
        return get().addPerson({
          name: payload.person.name,
          city: payload.person.city,
          values: payload.person.values ?? [],
          note: payload.person.note ?? `Eingeladen von ${payload.from}.`,
          profession: payload.person.profession ?? "",
          email: payload.person.email ?? "",
        });
      },
    }),
    {
      name: "zirkel-network-v2",
      partialize: (s) => ({
        people: s.people,
        circles: s.circles,
        seenIntro: s.seenIntro,
      }),
    },
  ),
);

export function youId(people: Person[]) {
  return people.find((p) => p.isYou)?.id ?? YOU_PERSON_ID;
}
