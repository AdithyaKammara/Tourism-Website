import type { DestinationCard } from '../destinations';
import type { Trip } from './types';

// RFC 5545 text escaping and 75-octet line folding.
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  for (const ch of line) {
    if (new TextEncoder().encode(current + ch).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join('\r\n ');
}

const ymd = (date: string) => date.replace(/-/g, '');
function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * An .ics calendar with one all-day event per trip day, timed events for activities that have a time,
 * and all-day events for dated bookings. Times are local ("floating"), which is what travellers expect.
 */
export function tripToICS(trip: Trip, destinations: Map<string, DestinationCard>) {
  if (!trip.startDate) throw new Error('A start date is needed to export to a calendar.');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Goadi//Trip planner//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(trip.title)}`];
  const event = (uid: string, fields: string[]) => lines.push('BEGIN:VEVENT', `UID:${uid}@goadi`, `DTSTAMP:${stamp()}`, ...fields, 'END:VEVENT');

  trip.days.forEach((day, i) => {
    const date = addDays(trip.startDate!, i);
    const place = day.destinationId ? destinations.get(day.destinationId)?.name : undefined;
    const summary = `${trip.title}: day ${i + 1}${place ? ` in ${place}` : ''}`;
    const plan = day.items.map((it) => `${it.time ? `${it.time} ` : ''}${it.title}`).join('\n');
    event(day.id, [`DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(addDays(date, 1))}`, `SUMMARY:${esc(summary)}`, ...(plan ? [`DESCRIPTION:${esc(plan)}`] : []), 'TRANSP:TRANSPARENT']);

    for (const it of day.items) {
      if (!it.time) continue;
      const [h, m] = it.time.split(':').map(Number);
      const end = `${String(Math.min(23, h + 1)).padStart(2, '0')}${String(h >= 23 ? 59 : m).padStart(2, '0')}00`;
      event(it.id, [
        `DTSTART:${ymd(date)}T${it.time.replace(':', '')}00`,
        `DTEND:${ymd(date)}T${end}`,
        `SUMMARY:${esc(it.title)}`,
        ...(place ? [`LOCATION:${esc(place)}`] : []),
        ...(it.note ? [`DESCRIPTION:${esc(it.note)}`] : []),
      ]);
    }
  });

  for (const b of trip.bookings) {
    if (!b.date) continue;
    const details = [b.ref && `Ref: ${b.ref}`, b.note].filter(Boolean).join('\n');
    event(b.id, [`DTSTART;VALUE=DATE:${ymd(b.date)}`, `DTEND;VALUE=DATE:${ymd(addDays(b.date, 1))}`, `SUMMARY:${esc(`${b.kind[0].toUpperCase()}${b.kind.slice(1)}: ${b.title}`)}`, ...(details ? [`DESCRIPTION:${esc(details)}`] : [])]);
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const fileSafe = (s: string) => s.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'trip';
