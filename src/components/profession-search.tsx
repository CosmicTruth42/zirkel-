import { PROFESSIONS } from "@/lib/network/types";
import { useNetworkStore } from "@/lib/network/store";
import { cn } from "@/lib/utils";

export function ProfessionSearch() {
  const people = useNetworkStore((s) => s.people);
  const destination = useNetworkStore((s) => s.setDestination);
  const current = useNetworkStore((s) => s.destination);
  const setDestination = destination;

  const used = PROFESSIONS.filter((p) =>
    people.some((x) => (x.profession ?? "") === p),
  );

  if (used.length === 0) return null;

  return (
    <div>
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Ich suche</p>
      <p className="mt-1 mb-2 text-xs text-muted-foreground">
        Jemand im Netz, der so tickt wie du — zuerst der Beruf, dann der Weg.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {used.map((p) => {
          const on = current?.kind === "profession" && current.profession === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setDestination(on ? null : { kind: "profession", profession: p })}
              className={cn(
                "h-8 rounded-full px-3 text-xs",
                on
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
