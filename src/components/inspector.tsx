import { Mail, MapPin, Phone, Route, Share2, Trash2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { REGION_LABEL, CITIES } from "@/lib/network/cities";
import { HUE_CSS } from "@/lib/network/colors";
import { circlesOf, growthSeries, hopCounts, shortestPath } from "@/lib/network/graph";
import { PathSummary, useActivePath } from "@/components/path-summary";
import { ProfessionSearch } from "@/components/profession-search";
import { ShareDialog } from "@/components/share-dialog";
import { useNetworkStore, youId } from "@/lib/network/store";
import { PROFESSIONS } from "@/lib/network/types";
import { cn } from "@/lib/utils";

export function Inspector() {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const selectedPersonId = useNetworkStore((s) => s.selectedPersonId);
  const selectedCircleId = useNetworkStore((s) => s.selectedCircleId);
  const destination = useNetworkStore((s) => s.destination);

  const person = people.find((p) => p.id === selectedPersonId) ?? null;
  const circle = circles.find((c) => c.id === selectedCircleId) ?? null;

  if (destination) return <PathDetail />;
  if (person) return <PersonDetail />;
  if (circle) return <CircleDetail />;

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <p className="font-display text-xl tracking-tight">Wähle einen Knoten</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Klicke auf einen Menschen oder einen Kreis. Oder suche eine Stadt — dann
        zeigt Zirkel den kürzesten Weg durch vertraute Hände.
      </p>
      <PathSearch />
      <div className="mt-5">
        <ProfessionSearch />
      </div>
      <GrowthCard />
    </div>
  );
}

function PathSearch() {
  const destination = useNetworkStore((s) => s.destination);
  const setDestination = useNetworkStore((s) => s.setDestination);
  const people = useNetworkStore((s) => s.people);
  const citiesUsed = [...new Set(people.map((p) => p.city))];

  return (
    <div>
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Wohin</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CITIES.filter((c) => citiesUsed.includes(c.name))
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, "de"))
          .map((c) => {
            const on = destination?.kind === "city" && destination.city === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setDestination(on ? null : { kind: "city", city: c.name })}
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  on
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}

function PathDetail() {
  const destination = useNetworkStore((s) => s.destination);
  const setDestination = useNetworkStore((s) => s.setDestination);
  const active = useActivePath();
  if (!destination) return null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Pfad</p>
          <h2 className="font-display mt-1 text-2xl tracking-tight">
            {active?.label || "Anlaufstelle"}
          </h2>
          {active?.targetName && active.label !== active.targetName ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {active.targetName}
              {active.targetCity ? ` · ${active.targetCity}` : ""}
            </p>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDestination(null)}>
          Schließen
        </Button>
      </div>
      <PathSummary />
      <Separator />
      <ProfessionSearch />
      <PathSearch />
    </div>
  );
}

function PersonDetail() {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const selectedPersonId = useNetworkStore((s) => s.selectedPersonId);
  const selectPerson = useNetworkStore((s) => s.selectPerson);
  const selectCircle = useNetworkStore((s) => s.selectCircle);
  const setDestination = useNetworkStore((s) => s.setDestination);
  const removePerson = useNetworkStore((s) => s.removePerson);
  const updatePerson = useNetworkStore((s) => s.updatePerson);
  const person = people.find((p) => p.id === selectedPersonId);
  const you = people.find((p) => p.isYou);
  const [shareOpen, setShareOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  if (!person) return null;

  const mine = circlesOf(person.id, circles);
  const origin = youId(people);
  const path = person.isYou ? [person.id] : shortestPath(origin, person.id, circles);
  const hops = path ? path.length - 1 : null;

  function startEdit() {
    setEmail(person!.email ?? "");
    setPhone(person!.phone ?? "");
    setProfession(person!.profession ?? "");
    setEditing(true);
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div>
        <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
          {person.isYou ? "Ursprung" : REGION_LABEL[person.region]}
        </p>
        <h2 className="font-display mt-1 text-2xl tracking-tight">{person.name}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {person.profession ? `${person.profession} · ` : ""}
          {person.city}
        </p>
      </div>

      {person.note ? (
        <p className="text-sm leading-relaxed text-foreground/85">{person.note}</p>
      ) : null}

      <div className="flex flex-col gap-1.5 text-sm">
        {person.email ? (
          <a
            href={`mailto:${person.email}`}
            className="inline-flex items-center gap-2 text-foreground hover:text-primary"
          >
            <Mail className="size-3.5 text-muted-foreground" />
            {person.email}
          </a>
        ) : null}
        {person.phone ? (
          <a
            href={`tel:${person.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-2 text-foreground hover:text-primary"
          >
            <Phone className="size-3.5 text-muted-foreground" />
            {person.phone}
          </a>
        ) : null}
        {!person.email && !person.phone ? (
          <p className="text-xs text-muted-foreground">Noch kein Kontakt hinterlegt.</p>
        ) : null}
      </div>

      {editing ? (
        <form
          className="flex flex-col gap-3 rounded-xl bg-secondary p-3"
          onSubmit={(e) => {
            e.preventDefault();
            updatePerson(person.id, { email, phone, profession });
            setEditing(false);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label>Beruf</Label>
            <Input value={profession} onChange={(e) => setProfession(e.target.value)} />
            <div className="flex flex-wrap gap-1">
              {PROFESSIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProfession(p)}
                  className={cn(
                    "h-7 rounded-full px-2.5 text-xs",
                    profession === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-email">E-Mail</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-phone">Telefon (freiwillig)</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 …"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              Speichern
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {person.values.map((v) => (
          <span key={v} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
            {v}
          </span>
        ))}
      </div>

      <div className="rounded-xl bg-secondary p-4">
        <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Distanz</p>
        <p className="mt-1 font-display text-2xl tabular-nums tracking-tight">
          {hops === null ? "—" : hops === 0 ? "Hier" : hops === 1 ? "1 Kreis" : `${hops} Kreise`}
        </p>
        {path && hops && hops > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {path
              .map((id) => people.find((p) => p.id === id)?.name.split(" ")[0])
              .join(" → ")}
          </p>
        ) : null}
      </div>

      <div>
        <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Kreise</p>
        <ul className="mt-2 flex flex-col gap-1">
          {mine.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => selectCircle(c.id)}
                className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-accent"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: HUE_CSS[c.hue] }}
                />
                {c.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {c.memberIds.length}
                </span>
              </button>
            </li>
          ))}
          {mine.length === 0 ? (
            <li className="text-sm text-muted-foreground">Noch in keinem Kreis.</li>
          ) : null}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Button variant="outline" onClick={() => setShareOpen(true)}>
          <Share2 className="size-4" />
          Link oder QR
        </Button>
        {!editing ? (
          <Button variant="subtle" onClick={startEdit}>
            Kontakt hinterlegen
          </Button>
        ) : null}
        {!person.isYou ? (
          <Button
            variant="outline"
            onClick={() => setDestination({ kind: "person", id: person.id })}
          >
            <Route className="size-4" />
            Weg zu {person.name.split(" ")[0]}
          </Button>
        ) : null}
        {!person.isYou ? (
          <Button variant="ghost" onClick={() => removePerson(person.id)}>
            <Trash2 className="size-4" />
            Entfernen
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => selectPerson(null)}>
          Auswahl lösen
        </Button>
      </div>
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        person={person}
        circle={mine[0] ?? null}
        fromName={you?.name === "Du" ? "Ein Kreis" : (you?.name ?? "Zirkel")}
      />
    </div>
  );
}

function CircleDetail() {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const selectedCircleId = useNetworkStore((s) => s.selectedCircleId);
  const selectPerson = useNetworkStore((s) => s.selectPerson);
  const selectCircle = useNetworkStore((s) => s.selectCircle);
  const removeCircle = useNetworkStore((s) => s.removeCircle);
  const [shareOpen, setShareOpen] = useState(false);
  const circle = circles.find((c) => c.id === selectedCircleId);
  const you = people.find((p) => p.isYou);
  if (!circle) return null;
  const members = circle.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean);
  const sharePerson = you ?? members[0] ?? null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-full" style={{ background: HUE_CSS[circle.hue] }} />
        <h2 className="font-display text-2xl tracking-tight">{circle.name}</h2>
      </div>
      {circle.note ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{circle.note}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">{members.length} Menschen · 3–5 ist das Maß</p>
      <ul className="flex flex-col gap-1">
        {members.map((p) =>
          p ? (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => selectPerson(p.id)}
                className="flex h-11 w-full items-center justify-between rounded-md px-2 text-left text-sm hover:bg-accent"
              >
                <span>
                  {p.name}
                  {p.isYou ? (
                    <span className="ml-2 text-xs text-muted-foreground">Du</span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {[p.profession, p.city].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          ) : null,
        )}
      </ul>
      <div className="mt-auto flex flex-col gap-2">
        <Button variant="outline" onClick={() => setShareOpen(true)}>
          <Share2 className="size-4" />
          Kreis-QR
        </Button>
        <Button variant="ghost" onClick={() => removeCircle(circle.id)}>
          <Trash2 className="size-4" />
          Kreis auflösen
        </Button>
        <Button variant="ghost" onClick={() => selectCircle(null)}>
          Auswahl lösen
        </Button>
      </div>
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        person={sharePerson}
        circle={circle}
        fromName={you?.name === "Du" ? "Ein Kreis" : (you?.name ?? "Zirkel")}
      />
    </div>
  );
}

function GrowthCard() {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const series = growthSeries(people, circles).map((e) => ({
    ...e,
    label: new Date(e.at).toLocaleDateString("de-DE", {
      month: "short",
      year: "2-digit",
    }),
  }));
  const origin = youId(people);
  const hops = hopCounts(origin, circles);

  return (
    <div className="mt-auto rounded-xl bg-secondary p-4">
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Wachstum</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat n={people.length} label="Menschen" />
        <Stat n={circles.length} label="Kreise" />
        <Stat n={hops.withinTwo} label="in 2 Schritten" />
      </div>
      {series.length > 1 ? (
        <div className="mt-3 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gPeople" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  value as number,
                  name === "people" ? "Menschen" : "Kreise",
                ]}
              />
              <Area
                type="monotone"
                dataKey="people"
                stroke="var(--color-foreground)"
                fill="url(#gPeople)"
                strokeWidth={1.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="font-display text-xl tabular-nums tracking-tight">{n}</p>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

export function CirclesRoster() {
  const people = useNetworkStore((s) => s.people);
  const circles = useNetworkStore((s) => s.circles);
  const selectedCircleId = useNetworkStore((s) => s.selectedCircleId);
  const selectCircle = useNetworkStore((s) => s.selectCircle);
  const selectPerson = useNetworkStore((s) => s.selectPerson);
  const valueFilter = useNetworkStore((s) => s.valueFilter);
  const setValueFilter = useNetworkStore((s) => s.setValueFilter);
  const origin = youId(people);
  const hops = hopCounts(origin, circles);

  const allValues = [...new Set(people.flatMap((p) => p.values))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <h2 className="font-display text-2xl tracking-tight">Kreise</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {circles.length} Kreise · Reichweite {hops.maxHops} Schritte
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {allValues.map((v) => {
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

      <ul className="mt-5 flex flex-col gap-2">
        {circles.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => selectCircle(c.id)}
              className={cn(
                "w-full rounded-xl p-3 text-left shadow-[0_0_0_1px_var(--color-border)]",
                selectedCircleId === c.id && "bg-secondary",
              )}
            >
              <span className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: HUE_CSS[c.hue] }}
                />
                {c.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {c.memberIds.length}
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {c.memberIds
                  .map((id) => people.find((p) => p.id === id)?.name.split(" ")[0])
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <h3 className="font-display mt-8 text-lg tracking-tight">Menschen</h3>
      <ul className="mt-2 flex flex-col">
        {people
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, "de"))
          .map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => selectPerson(p.id)}
                className="flex h-11 w-full items-center justify-between rounded-md px-1 text-left text-sm hover:bg-accent"
              >
                <span>
                  {p.name}
                  {p.isYou ? (
                    <span className="ml-2 text-xs text-muted-foreground">Du</span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">{p.city}</span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function PathPanel() {
  return (
    <div className="p-5">
      <PathSearch />
    </div>
  );
}
