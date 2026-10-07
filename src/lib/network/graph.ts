import { polygonHull } from "d3-polygon";
import type { Circle, Person } from "./types";

export type Edge = {
  source: string;
  target: string;
  circleIds: string[];
};

export function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function buildEdges(circles: Circle[]): Edge[] {
  const map = new Map<string, Edge>();
  for (const circle of circles) {
    const ids = circle.memberIds;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!;
        const b = ids[j]!;
        const key = pairKey(a, b);
        const existing = map.get(key);
        if (existing) existing.circleIds.push(circle.id);
        else map.set(key, { source: a, target: b, circleIds: [circle.id] });
      }
    }
  }
  return [...map.values()];
}

export function adjacency(circles: Circle[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a)!.add(b);
  };
  for (const edge of buildEdges(circles)) {
    add(edge.source, edge.target);
    add(edge.target, edge.source);
  }
  return adj;
}

export function shortestPath(
  fromId: string,
  toId: string,
  circles: Circle[],
): string[] | null {
  if (fromId === toId) return [fromId];
  const adj = adjacency(circles);
  const q: string[] = [fromId];
  const prev = new Map<string, string | null>([[fromId, null]]);
  while (q.length) {
    const cur = q.shift()!;
    for (const next of adj.get(cur) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, cur);
      if (next === toId) {
        const path = [toId];
        let walk: string | null = toId;
        while (walk) {
          const parent: string | null = prev.get(walk) ?? null;
          if (parent) path.push(parent);
          walk = parent;
        }
        path.reverse();
        return path;
      }
      q.push(next);
    }
  }
  return null;
}

export function nearestInCity(
  fromId: string,
  city: string,
  people: Person[],
  circles: Circle[],
): { person: Person; path: string[] } | null {
  const targets = people.filter(
    (p) => p.city.toLowerCase() === city.toLowerCase() && p.id !== fromId,
  );
  if (targets.length === 0) return null;
  let best: { person: Person; path: string[] } | null = null;
  for (const t of targets) {
    const path = shortestPath(fromId, t.id, circles);
    if (!path) continue;
    if (!best || path.length < best.path.length) best = { person: t, path };
  }
  return best;
}

export function nearestByProfession(
  fromId: string,
  profession: string,
  people: Person[],
  circles: Circle[],
): { person: Person; path: string[] } | null {
  const q = profession.trim().toLowerCase();
  if (!q) return null;
  const targets = people.filter(
    (p) => p.id !== fromId && (p.profession ?? "").toLowerCase() === q,
  );
  if (targets.length === 0) return null;
  let best: { person: Person; path: string[] } | null = null;
  for (const t of targets) {
    const path = shortestPath(fromId, t.id, circles);
    if (!path) continue;
    if (!best || path.length < best.path.length) best = { person: t, path };
  }
  return best;
}

export function hopCounts(fromId: string, circles: Circle[]) {
  const adj = adjacency(circles);
  const dist = new Map<string, number>([[fromId, 0]]);
  const q = [fromId];
  while (q.length) {
    const cur = q.shift()!;
    const d = dist.get(cur) ?? 0;
    for (const next of adj.get(cur) ?? []) {
      if (dist.has(next)) continue;
      dist.set(next, d + 1);
      q.push(next);
    }
  }
  let max = 0;
  let withinTwo = 0;
  for (const d of dist.values()) {
    if (d > max) max = d;
    if (d > 0 && d <= 2) withinTwo += 1;
  }
  return { reachable: dist.size, maxHops: max, withinTwo, dist };
}

export function sharedCircles(a: string, b: string, circles: Circle[]) {
  return circles.filter(
    (c) => c.memberIds.includes(a) && c.memberIds.includes(b),
  );
}

export function circlesOf(personId: string, circles: Circle[]) {
  return circles.filter((c) => c.memberIds.includes(personId));
}

export type Point = { x: number; y: number };

export function inflateHull(
  points: [number, number][],
  pad: number,
): [number, number][] {
  if (points.length === 0) return [];
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [x + (dx / len) * pad, y + (dy / len) * pad];
  });
}

export function hullForPositions(
  positions: Point[],
  pad = 34,
): [number, number][] | null {
  if (positions.length === 0) return null;
  if (positions.length === 1) {
    const p = positions[0]!;
    const r = pad + 10;
    const ring: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ring.push([p.x + Math.cos(a) * r, p.y + Math.sin(a) * r]);
    }
    return ring;
  }
  if (positions.length === 2) {
    const a = positions[0]!;
    const b = positions[1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * pad;
    const ny = (dx / len) * pad;
    const tx = (dx / len) * pad;
    const ty = (dy / len) * pad;
    return [
      [a.x - tx + nx, a.y - ty + ny],
      [a.x - tx - nx, a.y - ty - ny],
      [b.x + tx - nx, b.y + ty - ny],
      [b.x + tx + nx, b.y + ty + ny],
    ];
  }
  const raw = positions.map((p) => [p.x, p.y] as [number, number]);
  const hull = polygonHull(raw);
  if (!hull) return inflateHull(raw, pad);
  return inflateHull(hull, pad);
}

export function toPath(points: [number, number][]) {
  if (points.length === 0) return "";
  const start = points[0]!;
  return `M ${start[0]} ${start[1]} ${points
    .slice(1)
    .map((p) => `L ${p[0]} ${p[1]}`)
    .join(" ")} Z`;
}

export function edgeOnPath(a: string, b: string, path: string[] | null) {
  if (!path || path.length < 2) return false;
  for (let i = 0; i < path.length - 1; i++) {
    const x = path[i]!;
    const y = path[i + 1]!;
    if ((x === a && y === b) || (x === b && y === a)) return true;
  }
  return false;
}

export function growthSeries(people: Person[], circles: Circle[]) {
  const events: { at: number; people: number; circles: number }[] = [];
  const pSorted = [...people].sort((a, b) => a.addedAt - b.addedAt);
  const cSorted = [...circles].sort((a, b) => a.formedAt - b.formedAt);
  const stamps = [
    ...new Set([...pSorted.map((p) => p.addedAt), ...cSorted.map((c) => c.formedAt)]),
  ].sort((a, b) => a - b);
  for (const at of stamps) {
    events.push({
      at,
      people: pSorted.filter((p) => p.addedAt <= at).length,
      circles: cSorted.filter((c) => c.formedAt <= at).length,
    });
  }
  return events;
}
