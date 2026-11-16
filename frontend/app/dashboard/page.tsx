'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { ApiError, fetchOrganizerEvents } from '@/lib/api';
import type { OrganizerEventsResponse, OrganizerEvent } from '@/types/event';

export default function DashboardPage() {
  const [data, setData] = useState<OrganizerEventsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchOrganizerEvents(statusFilter === 'all' ? undefined : statusFilter)
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch((e) => {
        if (ignore) return;
        if (e instanceof ApiError && e.status === 401)
          setError('Please log in to view your dashboard.');
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
  }, [statusFilter]);

  // Combine and sort events
  const allEvents = useMemo(() => {
    const list: OrganizerEvent[] = [];
    if (data?.upcoming) list.push(...data.upcoming);
    if (data?.past) list.push(...data.past);
    return list;
  }, [data]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) =>
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.venue.toLowerCase().includes(search.toLowerCase()) ||
      ev.location.toLowerCase().includes(search.toLowerCase())
    );
  }, [allEvents, search]);

  // Analytics stats matching PDF Page 9
  const stats = useMemo(() => {
    const total = allEvents.length;
    const totalRsvps = allEvents.reduce((acc, e) => acc + (e.rsvp_count || 0), 0);
    const active = allEvents.filter((e) => e.status === 'active').length;
    const draftsOrPast = allEvents.filter((e) => e.status === 'cancelled' || new Date(e.start_time) < new Date()).length;
    return { total, totalRsvps, active, draftsOrPast };
  }, [allEvents]);

  const upcomingList = useMemo(() => {
    return (data?.upcoming ?? []).slice(0, 6);
  }, [data]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayAndMonth = (iso: string) => {
    const d = new Date(iso);
    return {
      day: d.getDate().toString().padStart(2, '0'),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  return (
    <div
      className="min-h-screen text-white flex"
      style={{
        backgroundColor: '#120726',
        backgroundImage:
          'radial-gradient(circle at 10% 15%, #4c1d95 0%, transparent 40%), radial-gradient(circle at 90% 85%, #831843 0%, transparent 45%)',
      }}
    >
      {/* Shared Left Sidebar matching PDF */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 lg:p-10 max-w-7xl overflow-x-hidden">
        {/* Header with Title and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl lg:text-5xl font-medium tracking-tight">
              Organizer Dashboard
            </h1>
            <p className="text-sm text-purple-200/80 mt-1">
              Manage your created events, track RSVPs, and view analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 bg-[#1e1038] border border-[#3d2766] rounded-full px-4 py-2.5 text-xs text-white placeholder-purple-300/50 outline-none focus:border-[#c026a3] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 4 Stat Cards Row matching PDF Page 9 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Events */}
          <div className="rounded-3xl p-6 bg-[#5ce1e6] text-[#120726] shadow-lg flex flex-col justify-between min-h-[120px]">
            <span className="text-xs font-semibold tracking-wide">Total Events</span>
            <span className="font-serif text-5xl font-normal leading-none mt-3">
              {stats.total}
            </span>
          </div>

          {/* Total RSVPs */}
          <div className="rounded-3xl p-6 bg-[#ff9ff3] text-[#120726] shadow-lg flex flex-col justify-between min-h-[120px]">
            <span className="text-xs font-semibold tracking-wide">Total RSVPs</span>
            <span className="font-serif text-5xl font-normal leading-none mt-3">
              {stats.totalRsvps}
            </span>
          </div>

          {/* Active */}
          <div className="rounded-3xl p-6 bg-[#7c4dff] text-white shadow-lg flex flex-col justify-between min-h-[120px]">
            <span className="text-xs font-semibold tracking-wide text-purple-200">Active</span>
            <span className="font-serif text-5xl font-normal leading-none mt-3">
              {stats.active}
            </span>
          </div>

          {/* Past / Cancelled */}
          <div className="rounded-3xl p-6 bg-[#c026a3] text-white shadow-lg flex flex-col justify-between min-h-[120px]">
            <span className="text-xs font-semibold tracking-wide text-pink-100">Past / Other</span>
            <span className="font-serif text-5xl font-normal leading-none mt-3">
              {stats.draftsOrPast}
            </span>
          </div>
        </div>

        {/* Loading and Error notifications */}
        {loading && (
          <div className="text-center py-10 text-purple-200/70">
            <p>Loading your events and live RSVP counts...</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-pink-500/10 border border-pink-500/30 p-4 mb-6 text-pink-300 text-sm">
            {error}
          </div>
        )}

        {/* Content Grid: Left 2 cols (Tables & Progress) + Right 1 col (Upcoming) */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* MY CREATED EVENTS Card */}
              <div className="rounded-3xl bg-[#1b0d36]/90 border border-[#351d5c] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      MY CREATED EVENTS
                    </h2>
                    {/* Status filter toggle */}
                    <div className="flex gap-1 text-[11px] bg-[#120726] p-0.5 rounded-full border border-[#351d5c]">
                      {(['all', 'upcoming', 'past'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-2.5 py-0.5 rounded-full capitalize transition-colors ${
                            statusFilter === s
                              ? 'bg-[#c026a3] text-white font-medium'
                              : 'text-purple-300 hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/dashboard/events/new"
                    className="rounded-full bg-[#c026a3] px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(192,38,163,0.5)] hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    + Create Event
                  </Link>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-purple-300/60 border border-dashed border-[#351d5c] rounded-2xl">
                    No events found. Click "+ Create Event" to publish your first one!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs text-purple-300/70 border-b border-[#351d5c]/60">
                          <th className="pb-3 font-semibold">Title</th>
                          <th className="pb-3 font-semibold">Date</th>
                          <th className="pb-3 font-semibold">Capacity</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#351d5c]/40 text-sm">
                        {filteredEvents.map((e) => {
                          const isCancelled = e.status === 'cancelled';
                          return (
                            <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 font-medium text-white pr-4 max-w-[200px] truncate">
                                {e.title}
                              </td>
                              <td className="py-3 text-purple-200/80 whitespace-nowrap">
                                {formatDate(e.start_time)}
                              </td>
                              <td className="py-3 text-purple-200/80 whitespace-nowrap font-mono text-xs">
                                {e.rsvp_count} / {e.capacity}
                              </td>
                              <td className="py-3 whitespace-nowrap">
                                {isCancelled ? (
                                  <span className="inline-block rounded-full border border-dashed border-red-400/60 px-2.5 py-0.5 text-xs text-red-300 font-medium">
                                    Cancelled
                                  </span>
                                ) : (
                                  <span className="inline-block rounded-full bg-[#86efac] text-[#065f46] px-3 py-0.5 text-xs font-semibold">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right whitespace-nowrap">
                                {!isCancelled ? (
                                  <Link
                                    href={`/dashboard/events/${e.id}/edit`}
                                    className="text-xs font-semibold text-white underline hover:text-[#ff9ff3] transition-colors"
                                  >
                                    Edit
                                  </Link>
                                ) : (
                                  <span className="text-xs text-purple-300/40 cursor-not-allowed">
                                    Edit
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* RSVPS PER EVENT Card */}
              <div className="rounded-3xl bg-[#1b0d36]/90 border border-[#351d5c] p-6 shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-5">
                  RSVPS PER EVENT
                </h2>

                {allEvents.length === 0 ? (
                  <p className="text-xs text-purple-300/60 py-4">No events to display analytics.</p>
                ) : (
                  <div className="space-y-4">
                    {allEvents.slice(0, 6).map((e) => {
                      const pct = Math.min(100, Math.round(((e.rsvp_count || 0) / e.capacity) * 100));
                      return (
                        <div key={e.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-white truncate max-w-[220px]">
                              {e.title}
                            </span>
                            <span className="font-mono text-purple-200">
                              {e.rsvp_count} / {e.capacity}
                            </span>
                          </div>
                          {/* Progress bar with Cyan fill matching PDF Page 9 */}
                          <div className="w-full h-3 rounded-full bg-[#2a1745] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#5ce1e6] transition-all duration-500 shadow-[0_0_10px_rgba(92,225,230,0.5)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: UPCOMING list matching PDF Page 9 */}
            <div>
              <div className="rounded-3xl bg-[#1b0d36]/90 border border-[#351d5c] p-6 shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-5">
                  UPCOMING
                </h2>

                {upcomingList.length === 0 ? (
                  <p className="text-xs text-purple-300/60 py-6 text-center">
                    No upcoming events scheduled.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingList.map((e) => {
                      const { day, month } = getDayAndMonth(e.start_time);
                      return (
                        <div
                          key={e.id}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#231245]/60 hover:bg-[#231245] transition-colors border border-transparent hover:border-[#351d5c]"
                        >
                          {/* Date badge circle matching PDF Page 9 */}
                          <div className="w-12 h-12 shrink-0 rounded-full bg-[#5ce1e6] text-[#120726] flex flex-col items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(92,225,230,0.3)]">
                            <span className="text-base leading-none font-bold">{day}</span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">{e.title}</p>
                            <p className="text-xs text-purple-300">
                              {month} · {e.venue}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
