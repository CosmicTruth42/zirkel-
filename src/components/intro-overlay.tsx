import { Button } from "@/components/ui/button";
import { useNetworkStore } from "@/lib/network/store";

export function IntroOverlay() {
  const seen = useNetworkStore((s) => s.seenIntro);
  const dismiss = useNetworkStore((s) => s.dismissIntro);
  const loadSeed = useNetworkStore((s) => s.loadSeed);
  const resetEmpty = useNetworkStore((s) => s.resetEmpty);

  if (seen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/75 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-[0_0_0_1px_var(--color-border),0_24px_80px_-32px_rgba(0,0,0,0.7)] sm:p-8">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Vertrauensnetz</p>
        <h1 className="font-display mt-3 text-4xl font-medium tracking-tight text-foreground">
          Zirkel
        </h1>
        <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Kreise aus drei bis fünf Menschen, die einander kennen und gleich denken.
            Jeder sitzt in weiteren Kreisen. So wächst ein Netz — von München bis Kiel.
          </p>
          <p>
            Wenn du einen Anwalt brauchst, der gleich denkt, suchst du zuerst im Netz.
            Der Weg dorthin sind Vorstellungen — nicht ein Verzeichnis von Fremden.
          </p>
        </div>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => {
              loadSeed();
              dismiss();
            }}
          >
            Beispielnetz erkunden
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              resetEmpty();
              dismiss();
            }}
          >
            Bei mir beginnen
          </Button>
        </div>
      </div>
    </div>
  );
}
