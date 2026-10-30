import { useState } from 'react';
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { usePlanner } from '../../lib/planner/store';
import { dayLabel, formatINR, newDay, uid, type Day, type ItineraryItem, type Trip } from '../../lib/planner/types';
import { inputClass, useDestinations } from './ui';

export default function Itinerary({ trip }: { trip: Trip }) {
  const update = usePlanner((s) => s.updateTrip);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** The day an id belongs to: either the day itself (empty-day drop zone) or the day holding that item. */
  const dayOf = (t: Trip, id: string) => t.days.find((d) => d.id === id || d.items.some((i) => i.id === id));

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    update(trip.id, (t) => {
      const from = dayOf(t, String(active.id));
      const to = dayOf(t, String(over.id));
      if (!from || !to || from === to) return;
      const index = from.items.findIndex((i) => i.id === active.id);
      const [item] = from.items.splice(index, 1);
      const overIndex = to.items.findIndex((i) => i.id === over.id);
      to.items.splice(overIndex === -1 ? to.items.length : overIndex, 0, item);
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    update(trip.id, (t) => {
      const day = dayOf(t, String(active.id));
      if (!day || day !== dayOf(t, String(over.id))) return;
      const from = day.items.findIndex((i) => i.id === active.id);
      const to = day.items.findIndex((i) => i.id === over.id);
      if (from !== -1 && to !== -1) day.items = arrayMove(day.items, from, to);
    });
  }

  return (
    <div>
      <p className="mb-6 text-sm text-ink-soft">Drag activities to reorder them or move them to another day.</p>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <ol className="space-y-6">
          {trip.days.map((day, i) => (
            <DayCard key={day.id} trip={trip} day={day} index={i} />
          ))}
        </ol>
      </DndContext>
      <button
        type="button"
        className="btn-outline mt-6"
        onClick={() => update(trip.id, (t) => void t.days.push(newDay(t.days.at(-1)?.destinationId)))}
      >
        <Plus className="size-4" aria-hidden="true" /> Add a day
      </button>
    </div>
  );
}

function DayCard({ trip, day, index }: { trip: Trip; day: Day; index: number }) {
  const update = usePlanner((s) => s.updateTrip);
  const destinations = useDestinations();
  const { setNodeRef } = useDroppable({ id: day.id });
  const place = day.destinationId ? destinations.get(day.destinationId) : undefined;
  const dayCost = day.items.reduce((sum, i) => sum + (i.cost ?? 0), 0);
  const edit = (change: (d: Day) => void) =>
    update(trip.id, (t) => {
      const d = t.days.find((x) => x.id === day.id);
      if (d) change(d);
    });

  return (
    <li className="rounded-3xl bg-card p-5 shadow-soft md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {place && <img src={place.image.src} alt="" className="size-10 rounded-xl object-cover" />}
          <div>
            <h3 className="font-display text-2xl">{dayLabel(trip, index)}</h3>
            <select
              aria-label={`Where you're based on day ${index + 1}`}
              value={day.destinationId ?? ''}
              onChange={(e) => edit((d) => void (d.destinationId = e.target.value || undefined))}
              className="-ml-1 bg-transparent text-sm text-ink-soft hover:text-ink focus:outline-none"
            >
              <option value="">No base set</option>
              {trip.destinationIds.map((id) => (
                <option key={id} value={id}>
                  Based in {destinations.get(id)?.name ?? id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-soft">
          {dayCost > 0 && <span>{formatINR(dayCost)}</span>}
          {trip.days.length > 1 && (
            <button
              type="button"
              aria-label={`Remove day ${index + 1}`}
              className="grid size-9 place-items-center rounded-full hover:bg-paper-deep hover:text-red-700"
              onClick={() => {
                if (day.items.length && !confirm(`Remove day ${index + 1} and its ${day.items.length} activities?`)) return;
                update(trip.id, (t) => void (t.days = t.days.filter((d) => d.id !== day.id)));
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <SortableContext id={day.id} items={day.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="mt-4 min-h-12 space-y-2" aria-label={`Activities on day ${index + 1}`}>
          {day.items.map((item) => (
            <ItemRow key={item.id} item={item} onChange={(change) => edit((d) => {
              const it = d.items.find((x) => x.id === item.id);
              if (it) change(it);
            })} onRemove={() => edit((d) => void (d.items = d.items.filter((x) => x.id !== item.id)))} />
          ))}
          {day.items.length === 0 && (
            <li className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-soft">Nothing planned yet. Add something below or drag it here.</li>
          )}
        </ul>
      </SortableContext>

      <AddItem onAdd={(item) => edit((d) => void d.items.push(item))} />
    </li>
  );
}

function ItemRow({ item, onChange, onRemove }: { item: ItineraryItem; onChange: (change: (i: ItineraryItem) => void) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-2xl border border-line bg-paper px-2 py-2 ${isDragging ? 'z-10 opacity-80 shadow-soft' : ''}`}
    >
      <button
        type="button"
        className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-soft hover:bg-paper-deep active:cursor-grabbing"
        aria-label={`Move ${item.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      {/* On phones the name takes the first line and time/cost share the second. */}
      <div className="grid min-w-0 flex-1 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 sm:grid-cols-[6rem_1fr_auto]">
      <input
        type="time"
        aria-label={`Time for ${item.title}`}
        value={item.time ?? ''}
        onChange={(e) => onChange((i) => void (i.time = e.target.value || undefined))}
        className="w-24 bg-transparent text-sm text-ink-soft focus:outline-none"
      />
      <input
        aria-label="Activity"
        value={item.title}
        maxLength={160}
        onChange={(e) => onChange((i) => void (i.title = e.target.value))}
        className="order-first col-span-2 min-w-0 bg-transparent text-sm focus:outline-none sm:order-none sm:col-span-1"
      />
      <label className="flex items-center gap-1 justify-self-end text-sm text-ink-soft">
        <span aria-hidden="true">₹</span>
        <span className="sr-only">Cost of {item.title} in rupees</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          value={item.cost ?? ''}
          onChange={(e) => onChange((i) => void (i.cost = e.target.value ? Math.max(0, Number(e.target.value)) : undefined))}
          className="w-20 bg-transparent text-right focus:outline-none"
        />
      </label>
      </div>
      <button type="button" aria-label={`Remove ${item.title}`} onClick={onRemove} className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-paper-deep hover:text-red-700">
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

function AddItem({ onAdd }: { onAdd: (item: ItineraryItem) => void }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  return (
    <form
      className="mt-4 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd({ id: uid(), title: title.trim(), time: time || undefined });
        setTitle('');
        setTime('');
      }}
    >
      <input type="time" aria-label="Time (optional)" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputClass} w-32`} />
      <input aria-label="New activity" placeholder="Add an activity, e.g. Sunrise at Hemakuta Hill" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} min-w-48 flex-1`} />
      <button type="submit" className="btn-outline py-2.5" disabled={!title.trim()}>
        <Plus className="size-4" aria-hidden="true" /> Add
      </button>
    </form>
  );
}
