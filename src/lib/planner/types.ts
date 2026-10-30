export type ItineraryItem = {
  id: string;
  title: string;
  time?: string;
  note?: string;
  /** Cost for the whole group, in INR. Counted in the budget under "Activities". */
  cost?: number;
};

export type Day = {
  id: string;
  /** Where you're based that day. */
  destinationId?: string;
  items: ItineraryItem[];
};

export const EXPENSE_CATEGORIES = ['stay', 'transport', 'food', 'activities', 'other'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = { id: string; label: string; category: ExpenseCategory; amount: number };

export type PackingItem = { id: string; label: string; group: string; packed: boolean };

export const BOOKING_KINDS = ['stay', 'flight', 'train', 'bus', 'activity'] as const;
export type BookingKind = (typeof BOOKING_KINDS)[number];

export type Booking = { id: string; kind: BookingKind; title: string; date?: string; ref?: string; note?: string };

export type Trip = {
  id: string;
  title: string;
  /** ISO date (yyyy-mm-dd) of day 1, if known. */
  startDate?: string;
  travellers: number;
  /** Total budget for the whole group, in INR. */
  budget?: number;
  destinationIds: string[];
  days: Day[];
  expenses: Expense[];
  packing: PackingItem[];
  bookings: Booking[];
  createdAt: number;
  updatedAt: number;
};

export const uid = () => crypto.randomUUID();

export function newDay(destinationId?: string): Day {
  return { id: uid(), destinationId, items: [] };
}

/** "Day 2 · Sat 15 Nov" when the trip has a start date, otherwise "Day 2". */
export function dayLabel(trip: Trip, index: number) {
  const base = `Day ${index + 1}`;
  if (!trip.startDate) return base;
  const date = new Date(`${trip.startDate}T00:00:00`);
  date.setDate(date.getDate() + index);
  return `${base} · ${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`;
}

export function tripDateRange(trip: Trip) {
  if (!trip.startDate || trip.days.length === 0) return null;
  const start = new Date(`${trip.startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + trip.days.length - 1);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return trip.days.length === 1 ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatINR = (n: number) => inr.format(n);

/** Money committed so far: logged expenses plus itinerary item costs (counted as activities). */
export function tripSpend(trip: Trip) {
  const byCategory = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, 0])) as Record<ExpenseCategory, number>;
  trip.expenses.forEach((e) => (byCategory[e.category] += e.amount));
  byCategory.activities += trip.days.flatMap((d) => d.items).reduce((sum, i) => sum + (i.cost ?? 0), 0);
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
  return { byCategory, total };
}
