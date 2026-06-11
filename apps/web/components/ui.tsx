export function Card({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm ${className}`} {...props}>{children}</div>;
}

export function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "yellow" | "red" | "blue" | "indigo" | "purple" }) {
  const tones = {
    green: "bg-[#e6f5ef] text-[#18865a]",
    yellow: "bg-[#fff5db] text-[#a46f00]",
    red: "bg-[#fde8e6] text-[#ba3d37]",
    blue: "bg-[#e5f0fa] text-[#1d70b8]",
    indigo: "bg-[#eef2ff] text-[#4f46e5]",
    purple: "bg-[#faf5ff] text-[#7e22ce]",
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-[#18865a]">{note}</div>
    </Card>
  );
}

export function DataState({ message, tone = "loading" }: { message: string; tone?: "loading" | "empty" | "error" }) {
  const tones = {
    loading: "border-[#dce2eb] bg-[#f8fafc] text-muted",
    empty: "border-[#dce2eb] bg-white text-muted",
    error: "border-[#f3c4c0] bg-[#fde8e6] text-[#ba3d37]",
  };
  return <div className={`rounded-lg border p-4 text-sm ${tones[tone]}`}>{message}</div>;
}
