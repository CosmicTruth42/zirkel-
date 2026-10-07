import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CITIES } from "@/lib/network/cities";
import { PROFESSIONS, VALUE_TAGS } from "@/lib/network/types";
import { useNetworkStore } from "@/lib/network/store";
import { cn } from "@/lib/utils";

type Props = {
  personOpen: boolean;
  circleOpen: boolean;
  onPersonOpenChange: (v: boolean) => void;
  onCircleOpenChange: (v: boolean) => void;
};

export function AddDialogs({
  personOpen,
  circleOpen,
  onPersonOpenChange,
  onCircleOpenChange,
}: Props) {
  return (
    <>
      <AddPersonDialog open={personOpen} onOpenChange={onPersonOpenChange} />
      <AddCircleDialog open={circleOpen} onOpenChange={onCircleOpenChange} />
    </>
  );
}

function AddPersonDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addPerson = useNetworkStore((s) => s.addPerson);
  const [name, setName] = useState("");
  const [city, setCity] = useState("München");
  const [values, setValues] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [profession, setProfession] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const cities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return CITIES.slice(0, 8);
    return CITIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cityQuery]);

  function reset() {
    setName("");
    setCity("München");
    setValues([]);
    setNote("");
    setCityQuery("");
    setProfession("");
    setEmail("");
    setPhone("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Person aufnehmen</DialogTitle>
          <DialogDescription>
            Nur Menschen, die du wirklich kennst. Danach in einen Kreis legen.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addPerson({ name, city, values, note, profession, email, phone });
            reset();
            onOpenChange(false);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vor- und Nachname"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-city">Ort</Label>
            <Input
              id="p-city"
              value={cityQuery || city}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setCity(e.target.value);
              }}
              placeholder="Stadt"
            />
            <div className="flex flex-wrap gap-1.5">
              {cities.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setCity(c.name);
                    setCityQuery("");
                  }}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs",
                    city === c.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Beruf</Label>
            <div className="flex flex-wrap gap-1.5">
              {PROFESSIONS.map((p) => {
                const on = profession === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProfession(on ? "" : p)}
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-email">E-Mail</Label>
            <Input
              id="p-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-phone">Telefon (freiwillig)</Label>
            <Input
              id="p-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 …"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Werte</Label>
            <div className="flex flex-wrap gap-1.5">
              {VALUE_TAGS.map((tag) => {
                const on = values.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setValues((v) => (on ? v.filter((x) => x !== tag) : [...v, tag]))
                    }
                    className={cn(
                      "h-8 rounded-full px-3 text-xs",
                      on
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-note">Notiz</Label>
            <Textarea
              id="p-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Wie kennt ihr euch? Was teilt ihr?"
            />
          </div>
          <Button type="submit" disabled={!name.trim()}>
            Aufnehmen
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCircleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const people = useNetworkStore((s) => s.people);
  const addCircle = useNetworkStore((s) => s.addCircle);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setMembers((m) => {
      if (m.includes(id)) return m.filter((x) => x !== id);
      if (m.length >= 5) return m;
      return [...m, id];
    });
  }

  function reset() {
    setName("");
    setNote("");
    setMembers([]);
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kreis bilden</DialogTitle>
          <DialogDescription>
            Drei bis fünf Menschen, die sich untereinander kennen.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const result = addCircle({ name, note, memberIds: members });
            if (typeof result === "object") {
              setError(result.error);
              return;
            }
            reset();
            onOpenChange(false);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-name">Name des Kreises</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Isar-Runde"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              Mitglieder
              <span className="ml-2 font-normal text-muted-foreground">
                {members.length} / 5
              </span>
            </Label>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg bg-secondary p-1.5">
              {people.map((p) => {
                const on = members.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "flex h-10 items-center justify-between rounded-md px-3 text-left text-sm",
                      on ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                  >
                    <span>
                      {p.name}
                      <span className={cn("ml-2", on ? "opacity-70" : "text-muted-foreground")}>
                        {p.city}
                      </span>
                    </span>
                    {p.isYou ? <span className="text-xs opacity-70">Du</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-note">Notiz</Label>
            <Textarea
              id="c-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Wann trefft ihr euch? Was hält den Kreis?"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit">Kreis schließen</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
