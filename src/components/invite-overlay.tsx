import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { decodeInvite } from "@/lib/network/invite";
import { useNetworkStore } from "@/lib/network/store";
import type { InvitePayload } from "@/lib/network/types";

export function InviteOverlay() {
  const importInvite = useNetworkStore((s) => s.importInvite);
  const dismissIntro = useNetworkStore((s) => s.dismissIntro);
  const [payload, setPayload] = useState<InvitePayload | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = new URLSearchParams(window.location.search).get("e");
    if (!token) return;
    const decoded = decodeInvite(token);
    if (decoded) setPayload(decoded);
  }, []);

  if (!payload) return null;

  function clear() {
    setPayload(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("e");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/75 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-[0_0_0_1px_var(--color-border),0_24px_80px_-32px_rgba(0,0,0,0.7)]">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Einladung</p>
        <h2 className="font-display mt-2 text-2xl tracking-tight">{payload.person.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {payload.person.profession ? `${payload.person.profession} · ` : ""}
          {payload.person.city}
          {payload.circle ? ` · ${payload.circle.name}` : ""}
        </p>
        {payload.person.note ? (
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">{payload.person.note}</p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">Von {payload.from}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => {
              importInvite(payload);
              dismissIntro();
              clear();
            }}
          >
            In mein Netz aufnehmen
          </Button>
          <Button variant="outline" className="flex-1" onClick={clear}>
            Ablehnen
          </Button>
        </div>
      </div>
    </div>
  );
}
