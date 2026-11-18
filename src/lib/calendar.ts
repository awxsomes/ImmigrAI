/**
 * A one-event calendar file (iCalendar, RFC 5545) that the owner opens to add a reminder to
 * their own phone or computer calendar. It is built on the device: this site cannot send
 * reminders itself, because it keeps no contact details.
 */

interface Reminder {
  /** Stable for one tool and one kind of date, so opening a new file updates the old event. */
  uid: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  /** A subscription charge repeats every month. */
  monthly?: boolean;
}

function escapeText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 bytes are folded, counting UTF-8 bytes so Chinese and Vietnamese stay intact. */
function fold(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function nextDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10).replaceAll("-", "");
}

export function reminderIcs({ uid, title, description, date, monthly }: Reminder) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ImmigrAI//Reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@immigrai`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`,
    `DTEND;VALUE=DATE:${nextDay(date)}`,
    ...(monthly ? ["RRULE:FREQ=MONTHLY"] : []),
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(title)}`,
    // 9 in the morning, three days before the date.
    "TRIGGER;RELATED=START:-P2DT15H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/** Hands the file to the browser, which offers to open it in the calendar app. */
export function downloadReminder(reminder: Reminder, filename: string) {
  const url = URL.createObjectURL(new Blob([reminderIcs(reminder)], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
