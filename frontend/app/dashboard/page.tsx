'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import { ApiError, fetchOrganizerEvents } from '@/lib/api';
import type { OrganizerEventsResponse, OrganizerEvent } from '@/types/event';

type Filter = 'all' | 'upcoming' | 'past';

function Section({
  title,
  events,
  emptyText,
}: {
  title: string;
  events: OrganizerEvent[];
  emptyText: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
        {title}
      </h2>
      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [data, setData] = useState<OrganizerEventsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchOrganizerEvents(filter === 'all' ? undefined : filter)
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch((e) => {
        if (ignore) return;
        if (e instanceof ApiError && e.status === 401)
          setError('Please log in again.');
        else if (e instanceof ApiError && e.status === 403)
          setError('This page is for organizers only.');
        else setError(e.message ?? 'Something went wrong.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [filter]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Organizer Dashboard
        </h1>
        {/* Placeholder: Create Event belongs to another ticket */}
        <Link
          href="/dashboard/events/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Create Event
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2 text-sm">
        {(['all', 'upcoming', 'past'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 capitalize transition-colors ${
              filter === f
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <p className="mt-8 text-gray-500">Loading your events…</p>
      )}

      {/* Error state */}
      {error && (
        <p className="mt-8 rounded-md bg-red-50 p-4 text-red-700">{error}</p>
      )}

      {/* Data */}
      {!loading && !error && data && (
        <>
          {filter !== 'past' && (
            <Section
              title="Upcoming"
              events={data.upcoming ?? []}
              emptyText="No upcoming events yet."
            />
          )}
          {filter !== 'upcoming' && (
            <Section
              title="Past"
              events={data.past ?? []}
              emptyText="No past events."
            />
          )}
        </>
      )}
    </main>
  );
}
