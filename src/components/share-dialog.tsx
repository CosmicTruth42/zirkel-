import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inviteUrl, personToInvite } from "@/lib/network/invite";
import type { Circle, Person } from "@/lib/network/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  person: Person | null;
  circle?: Circle | null;
  fromName: string;
};

export function ShareDialog({ open, onOpenChange, person, circle, fromName }: Props) {
  const [withEmail, setWithEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string>("");

  const url =
    person && open
      ? inviteUrl(
          personToInvite(
            person,
            fromName,
            circle ? { name: circle.name, note: circle.note } : undefined,
            withEmail,
          ),
        )
      : "";

  useEffect(() => {
    if (!url) {
      setQr("");
      return;
    }
    void QRCode.toDataURL(url, {
      margin: 1,
      width: 280,
      color: { dark: "#0e0e0c", light: "#eceae4" },
    }).then(setQr);
  }, [url]);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setWithEmail(false);
          setCopied(false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weitergeben</DialogTitle>
          <DialogDescription>
            Link oder QR — nur an Menschen, die du wirklich kennst. Telefon bleibt hier.
          </DialogDescription>
        </DialogHeader>
        {person ? (
          <div className="flex flex-col items-center gap-4">
            <p className="w-full text-sm text-muted-foreground">
              {person.name}
              {person.profession ? ` · ${person.profession}` : ""} · {person.city}
              {circle ? ` · Kreis ${circle.name}` : ""}
            </p>
            {qr ? (
              <img
                src={qr}
                alt="QR-Code der Einladung"
                width={220}
                height={220}
                className="rounded-lg bg-primary"
              />
            ) : (
              <div className="size-52 rounded-lg bg-secondary" />
            )}
            {person.email ? (
              <label className="flex w-full items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={withEmail}
                  onChange={(e) => setWithEmail(e.target.checked)}
                  className="size-4 accent-primary"
                />
                E-Mail mitgeben ({person.email})
              </label>
            ) : null}
            <Button className="w-full" variant="outline" onClick={() => void copy()}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Kopiert" : "Link kopieren"}
            </Button>
            <p className={cn("w-full break-all text-xs text-muted-foreground")}>{url}</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
