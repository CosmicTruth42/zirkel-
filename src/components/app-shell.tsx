import { Map, Network, Plus, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AddDialogs } from "@/components/add-dialogs";
import { GraphCanvas } from "@/components/graph-canvas";
import { GermanyMap } from "@/components/germany-map";
import { CirclesRoster, Inspector } from "@/components/inspector";
import { IntroOverlay } from "@/components/intro-overlay";
import { InviteOverlay } from "@/components/invite-overlay";
import { PathSummary } from "@/components/path-summary";
import { ProfessionSearch } from "@/components/profession-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nearestByProfession, nearestInCity, shortestPath } from "@/lib/network/graph";
import { useNetworkStore, youId } from "@/lib/network/store";
import type { ViewId } from "@/lib/network/types";
import { cn } from "@/lib/utils";

export function AppShell() {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const view = useNetworkStore((s) => s.view);
  const setView = useNetworkStore((s) => s.setView);
  const selectedPersonId = useNetworkStore((s) => s.selectedPersonId);
  const selectedCircleId = useNetworkStore((s) => s.selectedCircleId);
  const destination = useNetworkStore((s) => s.destination);
  const valueFilter = useNetworkStore((s) => s.valueFilter);
  const search = useNetworkStore((s) => s.search);
  const setSearch = useNetworkStore((s) => s.setSearch);
  const selectPerson = useNetworkStore((s) => s.selectPerson);
  const selectCircle = useNetworkStore((s) => s.selectCircle);
  const loadSeed = useNetworkStore((s) => s.loadSeed);
  const resetEmpty = useNetworkStore((s) => s.resetEmpty);

  const [personOpen, setPersonOpen] = useState(false);
  const [circleOpen, setCircleOpen] = useState(false);

  useEffect(() => {
    void useNetworkStore.persist.rehydrate();
  }, []);

  const origin = youId(people);
  const pathIds = useMemo(() => {
    if (!destination) return null;
    if (destination.kind === "person") {
      return shortestPath(origin, destination.id, circles);
    }
    if (destination.kind === "profession") {
      return nearestByProfession(origin, destination.profession, people, circles)?.path ?? null;
    }
    return nearestInCity(origin, destination.city, people, circles)?.path ?? null;
  }, [destination, origin, circles, people]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Mark />
          <span className="font-display text-lg tracking-tight">Zirkel</span>
        </div>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <ViewTab id="netz" label="Netz" icon={Network} current={view} onChange={setView} />
          <ViewTab id="karte" label="Karte" icon={Map} current={view} onChange={setView} />
          <ViewTab id="kreise" label="Kreise" icon={Users} current={view} onChange={setView} />
        </nav>

        <div className="relative ml-auto hidden w-56 sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, Ort, Beruf"
            className="h-9 pl-9"
          />
        </div>

        <Button size="sm" variant="subtle" onClick={() => setPersonOpen(true)}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Person</span>
        </Button>
        <Button size="sm" onClick={() => setCircleOpen(true)}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Kreis</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border lg:flex">
          <SidebarMeta />
        </aside>

        <main className="relative min-h-0 min-w-0 flex-1">
          <div className="absolute inset-0">
            {view === "netz" || view === "kreise" ? (
              <div className={view === "kreise" ? "hidden h-full lg:block" : "h-full"}>
                <GraphCanvas
                  people={people}
                  circles={circles}
                  selectedPersonId={selectedPersonId}
                  selectedCircleId={selectedCircleId}
                  pathIds={pathIds}
                  valueFilter={valueFilter}
                  search={search}
                  onSelectPerson={selectPerson}
                  onSelectCircle={selectCircle}
                />
              </div>
            ) : null}
            {view === "karte" ? (
              <GermanyMap
                people={people}
                circles={circles}
                selectedPersonId={selectedPersonId}
                pathIds={pathIds}
                valueFilter={valueFilter}
                onSelectPerson={selectPerson}
              />
            ) : null}
            {view === "kreise" ? (
              <div className="h-full overflow-y-auto lg:hidden">
                <CirclesRoster />
              </div>
            ) : null}
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 border-l border-border xl:block">
          {view === "kreise" ? <CirclesRoster /> : <Inspector />}
        </aside>
      </div>

      <div className="xl:hidden">
        {(selectedPersonId || selectedCircleId || destination) && view !== "kreise" ? (
          <div className="max-h-[42vh] border-t border-border bg-card">
            <Inspector />
          </div>
        ) : null}
      </div>

      <nav className="flex h-14 shrink-0 items-center justify-around border-t border-border md:hidden">
        <ViewTab id="netz" label="Netz" icon={Network} current={view} onChange={setView} />
        <ViewTab id="karte" label="Karte" icon={Map} current={view} onChange={setView} />
        <ViewTab id="kreise" label="Kreise" icon={Users} current={view} onChange={setView} />
      </nav>

      <div className="pointer-events-none absolute right-4 bottom-20 hidden text-right text-xs text-muted-foreground lg:block">
        <button
          type="button"
          className="pointer-events-auto mr-2 hover:text-foreground"
          onClick={loadSeed}
        >
          Beispiel laden
        </button>
        ·
        <button
          type="button"
          className="pointer-events-auto ml-2 hover:text-foreground"
          onClick={resetEmpty}
        >
          Leeren
        </button>
      </div>

      <AddDialogs
        personOpen={personOpen}
        circleOpen={circleOpen}
        onPersonOpenChange={setPersonOpen}
        onCircleOpenChange={setCircleOpen}
      />
      <InviteOverlay />
      <IntroOverlay />
    </div>
  );
}

function ViewTab({
  id,
  label,
  icon: Icon,
  current,
  onChange,
}: {
  id: ViewId;
  label: string;
  icon: typeof Network;
  current: ViewId;
  onChange: (v: ViewId) => void;
}) {
  const on = current === id;
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm",
        on ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <circle cx="9" cy="13" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="15" cy="13" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="8.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function SidebarMeta() {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const destination = useNetworkStore((s) => s.destination);
  const setDestination = useNetworkStore((s) => s.setDestination);
  const valueFilter = useNetworkStore((s) => s.valueFilter);
  const setValueFilter = useNetworkStore((s) => s.setValueFilter);
  const selectCircle = useNetworkStore((s) => s.selectCircle);
  const selectedCircleId = useNetworkStore((s) => s.selectedCircleId);
  const loadSeed = useNetworkStore((s) => s.loadSeed);
  const resetEmpty = useNetworkStore((s) => s.resetEmpty);

  const cities = [...new Set(people.map((p) => p.city))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );
  const values = [...new Set(people.flatMap((p) => p.values))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Dein Netz</p>
      <p className="font-display mt-2 text-3xl tracking-tight">
        {people.length}
        <span className="ml-2 text-base text-muted-foreground">Menschen</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{circles.length} Kreise · 3–5 je Kreis</p>

      <div className="mt-6">
        <ProfessionSearch />
      </div>

      <p className="mt-6 text-xs tracking-[0.14em] text-muted-foreground uppercase">Wohin</p>
      <p className="mt-1 mb-2 text-xs text-muted-foreground">
        Eine Stadt wählen — der Weg führt über vertraute Hände.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {cities.map((city) => {
          const on = destination?.kind === "city" && destination.city === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => setDestination(on ? null : { kind: "city", city })}
              className={cn(
                "h-8 rounded-full px-3 text-xs",
                on
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {city}
            </button>
          );
        })}
      </div>
      {destination ? (
        <div className="mt-4 rounded-xl bg-secondary p-3">
          <PathSummary compact />
        </div>
      ) : null}

      <p className="mt-6 text-xs tracking-[0.14em] text-muted-foreground uppercase">Werte</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((v) => {
          const on = valueFilter === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setValueFilter(on ? null : v)}
              className={cn(
                "h-8 rounded-full px-3 text-xs",
                on
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs tracking-[0.14em] text-muted-foreground uppercase">Kreise</p>
      <ul className="mt-2 flex flex-col gap-0.5">
        {circles.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => selectCircle(c.id)}
              className={cn(
                "flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm",
                selectedCircleId === c.id ? "bg-secondary" : "hover:bg-accent",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: `var(--color-circle-${c.hue})` }}
              />
              <span className="truncate">{c.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex gap-2 pt-6 text-xs text-muted-foreground">
        <button type="button" className="hover:text-foreground" onClick={loadSeed}>
          Beispiel
        </button>
        <span>·</span>
        <button type="button" className="hover:text-foreground" onClick={resetEmpty}>
          Leeren
        </button>
        <span>·</span>
        <a href="?install=1" className="hover:text-foreground">
          Als App
        </a>
      </div>
    </div>
  );
}
