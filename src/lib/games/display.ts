export function formatScheduleTime(
  date: Date | string | null | undefined,
  timezone?: string | null
): string {
  if (!date) return "Not set";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid date";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone || "UTC",
    }).format(d);
  } catch {
    return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  }
}

export function formatScheduleDate(
  date: Date | string | null | undefined,
  timezone?: string | null
): string {
  if (!date) return "Not set";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid date";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeZone: timezone || "UTC",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
