// Single source of truth: any status string → a semantic tone (sections/02 §2.3).
export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const MAP: Record<string, Tone> = {};
const add = (tone: Tone, keys: string[]) => keys.forEach((k) => (MAP[k.toLowerCase()] = tone));

add("success", ["ACTIVE", "VERIFIED", "APPROVED", "PAID", "PRESENT", "COMPLETED", "RELEASED", "HIRED", "SETTLED", "ACKNOWLEDGED", "CONFIRMED", "GRANTED"]);
add("warning", ["PENDING", "DRAFT", "OPEN", "PROBATION", "NOTICE_PERIOD", "HOLD", "SELF_DONE", "MANAGER_DONE", "ON_LEAVE", "DUE", "EXPIRING", "QUEUED", "AWAITING"]);
add("danger", ["REJECTED", "EXITED", "CONVERTED_LOP", "CONVERTED_TO_LOP", "FAILED", "OVERDUE", "ABSENT", "BREACHED", "LAPSED", "TERMINATED", "LOST", "DAMAGED"]);
add("info", ["SCHEDULED", "IN_REVIEW", "PROCESSING", "IN_PROGRESS", "SUBMITTED", "BOOKED", "INVESTIGATING", "ASSIGNED", "RESERVED"]);
add("neutral", ["INACTIVE", "REVERTED", "ARCHIVED", "CANCELLED", "WITHDRAWN", "NOT_REQUIRED", "NONE", "CLOSED", "RETURNED"]);

export function toneForStatus(status: string | null | undefined): Tone {
  if (!status) return "neutral";
  return MAP[String(status).toLowerCase()] ?? "neutral";
}

// Map legacy StatusPill tone names (kept for backward compatibility) → semantic tone.
export function toneFromLegacy(tone: string): Tone {
  switch (tone) {
    case "green": return "success";
    case "yellow": return "warning";
    case "red": return "danger";
    case "blue": return "info";
    case "indigo": return "brand";
    case "purple": return "neutral";
    default: return (tone as Tone) || "neutral";
  }
}

export function labelize(status: string): string {
  return String(status).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
