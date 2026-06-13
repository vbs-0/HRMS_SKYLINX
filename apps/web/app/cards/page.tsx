import { AppShell } from "../../components/app-shell";
import { CardGenerator } from "../../components/card-generator";

export default function CardsPage() {
  return (
    <AppShell title="ID & Visiting Card" subtitle="Generate employee ID cards, visiting cards, QR codes and print-ready PDFs.">
      <CardGenerator />
    </AppShell>
  );
}
