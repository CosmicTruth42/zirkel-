import type { InvitePayload, InvitePerson, Person } from "./types";

function bytesToBase64Url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeInvite(payload: InvitePayload): string {
  const json = JSON.stringify(payload);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodeInvite(token: string): InvitePayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(token));
    const data = JSON.parse(json) as InvitePayload;
    if (data?.v !== 1 || !data.person?.name || !data.person?.city) return null;
    return data;
  } catch {
    return null;
  }
}

export function personToInvite(person: Person, from: string, circle?: { name: string; note?: string }, withEmail = false): InvitePayload {
  const card: InvitePerson = {
    name: person.name,
    city: person.city,
    values: person.values,
  };
  if (person.profession) card.profession = person.profession;
  if (person.note) card.note = person.note;
  if (withEmail && person.email) card.email = person.email;
  return { v: 1, from, person: card, circle };
}

export function inviteUrl(payload: InvitePayload) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  return `${origin}${path}?e=${encodeInvite(payload)}`;
}

export function samePerson(a: { name: string; city: string }, b: { name: string; city: string }) {
  return (
    a.name.trim().toLowerCase() === b.name.trim().toLowerCase() &&
    a.city.trim().toLowerCase() === b.city.trim().toLowerCase()
  );
}
