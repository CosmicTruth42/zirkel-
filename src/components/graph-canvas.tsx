import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import { HUE_CSS } from "@/lib/network/colors";
import { buildEdges, edgeOnPath, hullForPositions, toPath } from "@/lib/network/graph";
import type { Circle, Person } from "@/lib/network/types";
import { initials } from "@/lib/utils";

type SimNode = SimulationNodeDatum & {
  id: string;
  person: Person;
};

type SimLink = SimulationLinkDatum<SimNode> & {
  circleIds: string[];
};

type Props = {
  people: Person[];
  circles: Circle[];
  selectedPersonId: string | null;
  selectedCircleId: string | null;
  pathIds: string[] | null;
  valueFilter: string | null;
  search: string;
  onSelectPerson: (id: string) => void;
  onSelectCircle: (id: string) => void;
};

type Transform = { x: number; y: number; k: number };

function nodeOf(link: SimLink, end: "source" | "target"): SimNode {
  const v = link[end];
  return typeof v === "object" ? v : ({ id: String(v), x: 0, y: 0 } as SimNode);
}

export function GraphCanvas({
  people,
  circles,
  selectedPersonId,
  selectedCircleId,
  pathIds,
  valueFilter,
  search,
  onSelectPerson,
  onSelectCircle,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [tick, setTick] = useState(0);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const panRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
    draggingNode: SimNode | null;
  } | null>(null);

  const peopleKey = people.map((p) => p.id).join(",");
  const circleKey = circles.map((c) => `${c.id}:${c.memberIds.join("-")}`).join("|");
  const edges = useMemo(() => buildEdges(circles), [circles, circleKey]);

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

  useEffect(() => {
    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    const nodes: SimNode[] = people.map((p) => {
      const old = prev.get(p.id);
      return {
        id: p.id,
        person: p,
        x: old?.x ?? size.w * (0.3 + Math.random() * 0.4),
        y: old?.y ?? size.h * (0.3 + Math.random() * 0.4),
        vx: old?.vx ?? 0,
        vy: old?.vy ?? 0,
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = edges
      .filter((e) => byId.has(e.source) && byId.has(e.target))
      .map((e) => ({
        source: byId.get(e.source)!,
        target: byId.get(e.target)!,
        circleIds: e.circleIds,
      }));

    nodesRef.current = nodes;
    linksRef.current = links;

    simRef.current?.stop();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(92)
          .strength(0.55),
      )
      .force("charge", forceManyBody().strength(-320))
      .force("collide", forceCollide(38))
      .force("center", forceCenter(size.w / 2, size.h / 2).strength(0.05))
      .alpha(reduced ? 1 : 0.85)
      .alphaDecay(reduced ? 0.2 : 0.028);

    if (reduced) {
      sim.tick(80);
      sim.stop();
      setTick((t) => t + 1);
    } else {
      sim.on("tick", () => setTick((t) => t + 1));
    }
    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [people, edges, size.w, size.h, peopleKey, circleKey]);

  const nodes = nodesRef.current;
  const links = linksRef.current;
  void tick;

  const q = search.trim().toLowerCase();
  const pathSet = pathIds ? new Set(pathIds) : null;

  function isDimmed(id: string) {
    const person = people.find((p) => p.id === id);
    if (!person) return false;
    if (valueFilter && !person.values.includes(valueFilter)) return true;
    if (q && !`${person.name} ${person.city} ${person.profession ?? ""}`.toLowerCase().includes(q)) return true;
    if (selectedCircleId) {
      const c = circles.find((x) => x.id === selectedCircleId);
      if (c && !c.memberIds.includes(id)) return true;
    }
    if (pathSet && !pathSet.has(id)) return true;
    return false;
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((t) => {
      const k = Math.min(2.8, Math.max(0.35, t.k * factor));
      const x = mx - ((mx - t.x) * k) / t.k;
      const y = my - ((my - t.y) * k) / t.k;
      return { x, y, k };
    });
  }

  function clientToWorld(clientX: number, clientY: number) {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - transform.x) / transform.k,
      y: (clientY - rect.top - transform.y) / transform.k,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    const target = e.target as HTMLElement;
    const nodeId = target.closest("[data-node]")?.getAttribute("data-node");
    const node = nodeId ? (nodes.find((n) => n.id === nodeId) ?? null) : null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      tx: transform.x,
      ty: transform.y,
      draggingNode: node,
    };
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
      simRef.current?.alphaTarget(0.25).restart();
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    if (pan.draggingNode) {
      const w = clientToWorld(e.clientX, e.clientY);
      pan.draggingNode.fx = w.x;
      pan.draggingNode.fy = w.y;
    } else {
      setTransform((t) => ({
        ...t,
        x: pan.tx + (e.clientX - pan.x),
        y: pan.ty + (e.clientY - pan.y),
      }));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    if (pan.draggingNode) {
      pan.draggingNode.fx = null;
      pan.draggingNode.fy = null;
      simRef.current?.alphaTarget(0);
    }
    panRef.current = null;
  }

  const hulls = circles
    .map((c) => {
      const pts = c.memberIds
        .map((id) => nodes.find((n) => n.id === id))
        .filter((n): n is SimNode => !!n && n.x != null && n.y != null)
        .map((n) => ({ x: n.x!, y: n.y! }));
      const hull = hullForPositions(pts, 38);
      return hull ? { circle: c, d: toPath(hull), pts } : null;
    })
    .filter(Boolean) as { circle: Circle; d: string; pts: { x: number; y: number }[] }[];

  const you = people.find((p) => p.isYou);

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden bg-background"
      onWheel={onWheel}
    >
      <svg
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label="Netzwerk der Kreise"
      >
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          {hulls.map(({ circle, d, pts }) => {
            const active = selectedCircleId === circle.id;
            const dim =
              (selectedCircleId && !active) ||
              (pathSet && !circle.memberIds.some((id) => pathSet.has(id)));
            const cx = pts.reduce((s, p) => s + p.x, 0) / Math.max(1, pts.length);
            const minY = pts.reduce((m, p) => Math.min(m, p.y), pts[0]?.y ?? 0);
            const color = HUE_CSS[circle.hue];
            return (
              <g key={circle.id}>
                <path
                  d={d}
                  fill={color}
                  fillOpacity={active ? 0.16 : dim ? 0.03 : 0.08}
                  stroke={color}
                  strokeOpacity={active ? 0.7 : dim ? 0.12 : 0.32}
                  strokeWidth={active ? 1.6 : 1}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCircle(circle.id);
                  }}
                />
                <text
                  x={cx}
                  y={minY - 16}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fill={color}
                  fillOpacity={dim ? 0.2 : 0.9}
                  fontSize={10}
                  fontFamily="Figtree, sans-serif"
                  letterSpacing="0.12em"
                >
                  {circle.name.toUpperCase()}
                </text>
              </g>
            );
          })}

          {links.map((link) => {
            const s = nodeOf(link, "source");
            const t = nodeOf(link, "target");
            if (s.x == null || t.x == null) return null;
            const on = edgeOnPath(s.id, t.id, pathIds);
            const dim = isDimmed(s.id) || isDimmed(t.id);
            return (
              <line
                key={`${s.id}-${t.id}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={on ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
                strokeOpacity={on ? 0.9 : dim ? 0.08 : 0.28}
                strokeWidth={on ? 2.2 : 1}
              />
            );
          })}

          {nodes.map((n) => {
            if (n.x == null || n.y == null) return null;
            const selected = n.id === selectedPersonId;
            const onPath = pathSet?.has(n.id);
            const dim = isDimmed(n.id) && !selected;
            const r = n.person.isYou ? 22 : 18;
            const hue = circles.find((c) => c.memberIds.includes(n.id))?.hue ?? "stone";
            const color = HUE_CSS[hue];
            return (
              <g
                key={n.id}
                data-node={n.id}
                transform={`translate(${n.x} ${n.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPerson(n.id);
                }}
                opacity={dim ? 0.22 : 1}
              >
                {n.person.isYou ? (
                  <circle
                    r={r + 5}
                    fill="none"
                    stroke="var(--color-foreground)"
                    strokeOpacity={0.35}
                  />
                ) : null}
                <circle
                  r={r + (selected || onPath ? 3 : 0)}
                  fill="var(--color-card)"
                  stroke={selected || onPath ? "var(--color-foreground)" : color}
                  strokeWidth={selected ? 2.4 : 1.6}
                />
                <text
                  textAnchor="middle"
                  y={5}
                  fill="#ffffff"
                  fontSize={n.person.isYou ? 10 : 11}
                  fontFamily="Figtree, sans-serif"
                  fontWeight={600}
                  className="pointer-events-none select-none"
                >
                  {initials(n.person.name)}
                </text>
                <text
                  textAnchor="middle"
                  y={r + 16}
                  fill="#ffffff"
                  stroke="#0e0e0c"
                  strokeWidth={4}
                  paintOrder="stroke"
                  strokeLinejoin="round"
                  fontSize={13}
                  fontFamily="Figtree, sans-serif"
                  fontWeight={700}
                  className="pointer-events-none select-none"
                >
                  {n.person.name}
                </text>
                <text
                  textAnchor="middle"
                  y={r + 31}
                  fill="#f2f0ea"
                  stroke="#0e0e0c"
                  strokeWidth={3}
                  paintOrder="stroke"
                  strokeLinejoin="round"
                  fontSize={11}
                  fontFamily="Figtree, sans-serif"
                  fontWeight={500}
                  className="pointer-events-none select-none"
                >
                  {n.person.city}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-4 left-4 hidden text-xs text-muted-foreground md:block">
        Ziehen zum Verschieben · Rad zum Zoomen
        {you ? <span className="ml-3 text-foreground/70">Ursprung: {you.city}</span> : null}
      </div>
    </div>
  );
}
