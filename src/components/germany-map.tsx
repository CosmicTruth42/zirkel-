import { useEffect, useRef, useState } from "react";
import { CITIES, GERMANY_RING, projectGeo } from "@/lib/network/cities";
import { HUE_CSS } from "@/lib/network/colors";
import { buildEdges, edgeOnPath } from "@/lib/network/graph";
import type { Circle, Person } from "@/lib/network/types";
import { initials } from "@/lib/utils";

type Props = {
  people: Person[];
  circles: Circle[];
  selectedPersonId: string | null;
  pathIds: string[] | null;
  valueFilter: string | null;
  onSelectPerson: (id: string) => void;
};

export function GermanyMap({
  people,
  circles,
  selectedPersonId,
  pathIds,
  valueFilter,
  onSelectPerson,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 720 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const outline = GERMANY_RING.map(([lng, lat]) =>
    projectGeo(lng, lat, size.w, size.h, 36),
  );
  const d = outline
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ") + " Z";

  const placed = people.map((p) => ({
    person: p,
    ...projectGeo(p.lng, p.lat, size.w, size.h, 36),
  }));

  // Jitter people in the same city so they don't stack perfectly
  const seen = new Map<string, number>();
  for (const p of placed) {
    const key = `${p.person.city}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    const angle = n * 2.4;
    p.x += Math.cos(angle) * (n * 16);
    p.y += Math.sin(angle) * (n * 16);
  }

  const byId = new Map(placed.map((p) => [p.person.id, p]));
  const edges = buildEdges(circles);
  const pathSet = pathIds ? new Set(pathIds) : null;

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-background">
      <svg className="absolute inset-0 h-full w-full" role="img" aria-label="Karte von Deutschland">
        <path
          d={d}
          fill="color-mix(in oklab, var(--color-foreground) 4%, transparent)"
          stroke="var(--color-border)"
          strokeWidth={1.2}
        />

        {CITIES.filter((c) =>
          ["München", "Hamburg", "Berlin", "Köln", "Frankfurt", "Leipzig", "Stuttgart", "Kiel", "Dresden", "Hannover", "Freiburg"].includes(
            c.name,
          ),
        ).map((c) => {
          const p = projectGeo(c.lng, c.lat, size.w, size.h, 36);
          return (
            <text
              key={c.name}
              x={p.x + 10}
              y={p.y - 10}
              fill="#ffffff"
              stroke="#0e0e0c"
              strokeWidth={4}
              paintOrder="stroke"
              strokeLinejoin="round"
              fontSize={13}
              fontFamily="Figtree, sans-serif"
              fontWeight={700}
              className="pointer-events-none"
            >
              {c.name}
            </text>
          );
        })}

        {edges.map((e) => {
          const a = byId.get(e.source);
          const b = byId.get(e.target);
          if (!a || !b) return null;
          const on = edgeOnPath(e.source, e.target, pathIds);
          const dim = pathSet && !on;
          return (
            <line
              key={`${e.source}-${e.target}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={on ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
              strokeOpacity={on ? 0.85 : dim ? 0.06 : 0.2}
              strokeWidth={on ? 2 : 1}
            />
          );
        })}

        {placed.map(({ person, x, y }) => {
          const selected = person.id === selectedPersonId;
          const onPath = pathSet?.has(person.id);
          const dim =
            (valueFilter && !person.values.includes(valueFilter)) ||
            (pathSet && !onPath && !selected);
          const hue = circles.find((c) => c.memberIds.includes(person.id))?.hue ?? "stone";
          const r = person.isYou ? 14 : 11;
          return (
            <g
              key={person.id}
              transform={`translate(${x} ${y})`}
              className="cursor-pointer"
              opacity={dim ? 0.22 : 1}
              onClick={() => onSelectPerson(person.id)}
            >
              {person.isYou ? (
                <circle r={r + 4} fill="none" stroke="var(--color-foreground)" strokeOpacity={0.4} />
              ) : null}
              <circle
                r={r}
                fill="var(--color-card)"
                stroke={selected || onPath ? "var(--color-foreground)" : HUE_CSS[hue]}
                strokeWidth={selected ? 2.2 : 1.5}
              />
              <text
                textAnchor="middle"
                y={4}
                fill="#ffffff"
                fontSize={10}
                fontFamily="Figtree, sans-serif"
                fontWeight={700}
                className="pointer-events-none"
              >
                {initials(person.name)}
              </text>
              <text
                textAnchor="middle"
                y={r + 18}
                fill="#ffffff"
                stroke="#0e0e0c"
                strokeWidth={4}
                paintOrder="stroke"
                strokeLinejoin="round"
                fontSize={13}
                fontFamily="Figtree, sans-serif"
                fontWeight={700}
                className="pointer-events-none"
              >
                {person.name.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
