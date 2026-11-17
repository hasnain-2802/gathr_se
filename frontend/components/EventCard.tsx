import Link from 'next/link';
import type { OrganizerEvent } from '@/types/event';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function EventCard({ event }: { event: OrganizerEvent }) {
  const cancelled = event.status === 'cancelled';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
            cancelled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {cancelled ? 'Cancelled' : 'Active'}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {fmt(event.start_time)} – {fmt(event.end_time)}
      </p>
      <p className="text-sm text-gray-600">
        {event.venue} · {event.location} · {event.category}
      </p>
      <p className="mt-2 text-sm font-medium text-gray-800">
        RSVPs: {event.rsvp_count} / {event.capacity}
      </p>
      <div className="mt-3 flex gap-3 text-sm">
        <Link
          className="text-blue-600 hover:underline"
          href={`/dashboard/events/${event.id}/registrations`}
        >
          View Registrations
        </Link>
        {!cancelled && (
          <Link
            className="text-blue-600 hover:underline"
            href={`/dashboard/events/${event.id}/edit`}
          >
            Edit
          </Link>
        )}
      </div>
    </div>
  );
}
