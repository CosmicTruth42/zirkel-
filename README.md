# Zirkel

Vertrauensnetz aus echten Kreisen. Kontakte bleiben im Browser — nicht auf dem Server.

## Bei Vercel veröffentlichen

1. Entpacke dieses Archiv.
2. Lege den Ordner auf GitHub (neues Repository, den ganzen Inhalt hinein).
3. Auf [vercel.com](https://vercel.com) ein Konto, dann **Add New** → **Project** → das Repository wählen.
4. Framework bleibt, wie Vercel es erkennt. Build-Command: `npm run build`.
5. Unter **Environment Variables** setzen:
   - Name: `VITE_AUTH_ENABLED`
   - Wert: `false`
6. **Deploy**. Du bekommst eine Adresse wie `zirkel-xxx.vercel.app`.
7. Die Adresse kommt in Link und QR.

Keine Datenbank, keine Anmeldung. Node 22, falls Vercel nach der Version fragt.

Optional: in Vercel unter **Domains** eine eigene Domain anbinden.

