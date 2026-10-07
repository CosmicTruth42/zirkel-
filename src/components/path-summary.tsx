import { Mail, Phone } from "lucide-react";
import { nearestByProfession, nearestInCity, sharedCircles, shortestPath } from "@/lib/network/graph";
import { useNetworkStore, youId } from "@/lib/network/store";
import { cn } from "@/lib/utils";

export function useActivePath() {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const destination = useNetworkStore((s) => s.destination);
  const origin = youId(people);

  if (!destination) return null;

  if (destination.kind === "person") {
    const p = people.find((x) => x.id === destination.id);
    const path = shortestPath(origin, destination.id, circles);
    return {
      path,
      targetName: p?.name ?? "",
      targetCity: p?.city ?? "",
      label: p?.name ?? "Person",
    };
  }

  if (destination.kind === "profession") {
    const hit = nearestByProfession(origin, destination.profession, people, circles);
    return {
      path: hit?.path ?? null,
      targetName: hit?.person.name ?? "",
      targetCity: hit?.person.city ?? "",
      label: destination.profession,
    };
  }

  const hit = nearestInCity(origin, destination.city, people, circles);
  return {
    path: hit?.path ?? null,
    targetName: hit?.person.name ?? "",
    targetCity: destination.city,
    label: destination.city,
  };
}

export function PathSummary({ compact = false }: { compact?: boolean }) {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const selectPerson = useNetworkStore((s) => s.selectPerson);
  const active = useActivePath();
  if (!active) return null;
  const { path, targetName, targetCity } = active;
  const hops = path ? path.length - 1 : null;
  const target = path ? people.find((p) => p.id === path[path.length - 1]) : null;

  if (!path || hops === null) {
    return (
      <p className="text-sm text-muted-foreground">
        {active.label
          ? `Niemand mit „${active.label}“ im Netz — oder der Weg reißt ab.`
          : `In ${targetCity} ist noch niemand im Netz.`}
      </p>
    );
  }

  return (
    <div>
      <p className={cn("text-sm text-muted-foreground", compact && "text-xs")}>
        {hops === 0
          ? "Du bist schon dort."
          : hops === 1
            ? `Direkter Kreis zu ${targetName}.`
            : `${hops} Knotenpunkte bis ${targetName}.`}
      </p>
      {target && !compact ? (
        <div className="mt-3 rounded-xl bg-secondary p-3 text-sm">
          <p className="font-medium">{target.name}</p>
          <p className="text-xs text-muted-foreground">
            {[target.profession, target.city].filter(Boolean).join(" · ")}
          </p>
          {target.email ? (
            <a href={`mailto:${target.email}`} className="mt-2 flex items-center gap-2 hover:text-primary">
              <Mail className="size-3.5 text-muted-foreground" />
              {target.email}
            </a>
          ) : null}
          {target.phone ? (
            <a
              href={`tel:${target.phone.replace(/\s+/g, "")}`}
              className="mt-1 flex items-center gap-2 hover:text-primary"
            >
              <Phone className="size-3.5 text-muted-foreground" />
              {target.phone}
            </a>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Kontakt nach der Vorstellung — so bleibt das Vertrauen im Kreis.
          </p>
        </div>
      ) : null}
      <ol className="mt-2 flex flex-col">
        {path.map((id, i) => {
          const person = people.find((p) => p.id === id);
          if (!person) return null;
          const next = path[i + 1];
          const bridge = next ? sharedCircles(id, next, circles)[0] : null;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => selectPerson(id)}
                className="flex w-full items-center gap-3 rounded-md py-1.5 text-left hover:bg-accent"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{person.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[person.profession, person.city].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
              {bridge ? (
                <div className="ml-3.5 border-l border-border py-1 pl-6 text-xs text-muted-foreground">
                  über {bridge.name}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
