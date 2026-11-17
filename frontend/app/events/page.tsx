'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type EventItem = {
  id: string;
  title: string;
  category: string;
  start_time: string;
  venue: string;
  location: string;
  capacity: number;
};

// Works whether NEXT_PUBLIC_API_URL is "http://localhost:5000" or ends in /api or /api/v1
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api(\/v1)?$/, '');

const RANGES = [
  { key: '', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

// The events table has no image column, so cards get a gradient picked from the category
const GRADIENTS = [
  'linear-gradient(135deg, #2b3a8f 0%, #5b3fa0 50%, #1a0b3b 100%)',
  'linear-gradient(135deg, #8a3b1f 0%, #5a2a3a 50%, #1a0b3b 100%)',
  'linear-gradient(135deg, #7a1f6b 0%, #3a1a7a 50%, #1a0b3b 100%)',
  'linear-gradient(135deg, #1f5f7a 0%, #2a3a8f 50%, #1a0b3b 100%)',
  'linear-gradient(135deg, #5a5a7a 0%, #3a2a6a 50%, #1a0b3b 100%)',
];

const gradientFor = (category: string) => {
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
};

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
};

const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";

export default function ExploreEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [range, setRange] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (r: string, cat: string, loc: string) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (r) params.set('range', r);
    if (cat) params.set('category', cat);
    if (loc) params.set('location', loc);
    const qs = params.toString();
    const url = `${API_URL}/api/v1/events${qs ? `?${qs}` : ''}`;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let json: { data?: EventItem[]; message?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        setError(
          json?.message
            ? `${json.message} (${res.status})`
            : res.status === 404
              ? `Feed endpoint not found (404) at ${url}`
              : `Server returned ${res.status}`
        );
        setEvents([]);
        return;
      }

      const data = json?.data ?? [];
      setEvents(data);
      setCategoryOptions((prev) => Array.from(new Set([...prev, ...data.map((e) => e.category)])).sort());
      setLocationOptions((prev) => Array.from(new Set([...prev, ...data.map((e) => e.location)])).sort());
    } catch {
      setError('Could not reach the backend. Is it running on port 5000?');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range, category, location);
  }, [load, range, category, location]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)
    );
  }, [events, search]);

  const logout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  };

  const navItem = (label: string, active = false, href?: string): React.ReactNode => {
    const style: React.CSSProperties = {
      display: 'block',
      padding: '12px 20px',
      borderRadius: 999,
      fontSize: 15,
      textDecoration: 'none',
      color: 'white',
      background: active ? '#c026d3' : 'transparent',
      boxShadow: active ? '0 0 24px rgba(192, 38, 211, 0.45)' : 'none',
      opacity: active || href ? 1 : 0.6,
      marginBottom: 6,
    };
    return href ? (
      <a href={href} style={style}>
        {label}
      </a>
    ) : (
      <span style={style} title="Separate story">
        {label}
      </span>
    );
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 999,
    border: 'none',
    background: '#4c1d95',
    color: 'white',
    fontSize: 13,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0722', color: 'white' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: '#0b0519',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#c026d3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            G
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 28 }}>Gathr</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingLeft: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#5eead4' }} />
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <div>[Your Name]</div>
            <div style={{ opacity: 0.7 }}>Attendee</div>
            <div style={{ textDecoration: 'underline' }}>My Profile</div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItem('Explore Events', true, '/events')}
          {navItem('My RSVPs')}
          {navItem('My Events')}
        </nav>

        <button
          type="button"
          onClick={logout}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            textAlign: 'left',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: 15,
          }}
        >
          Log out
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 40px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 500, margin: 0 }}>Explore City Events</h1>
            <p style={{ opacity: 0.7, fontSize: 14, margin: '8px 0 24px' }}>
              Discover community meetups, tech workshops, and student events happening around the city.
            </p>
          </div>
          <input
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: 280,
              padding: '14px 20px',
              borderRadius: 16,
              border: '1px solid #2a1859',
              background: '#170b35',
              color: 'white',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{ fontSize: 14 }}>Date:</span>
          <div style={{ display: 'flex', background: '#2a1359', borderRadius: 999, padding: 4 }}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: 14,
                  background: range === r.key ? '#c026d3' : 'transparent',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 14 }}>Category:</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
            <option value="">All</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {capitalize(c)}
              </option>
            ))}
          </select>

          <span style={{ fontSize: 14 }}>Location:</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)} style={selectStyle}>
            <option value="">All</option>
            {locationOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {!loading && !error && (
          <p style={{ opacity: 0.6, fontSize: 13, margin: '0 0 20px' }}>
            Showing {visible.length} active events matching your filters
          </p>
        )}
        {loading && <p style={{ opacity: 0.8 }}>Loading events…</p>}
        {error && <p style={{ color: '#ff8a8a' }}>{error}</p>}
        {!loading && !error && visible.length === 0 && <p style={{ opacity: 0.8 }}>No upcoming events found.</p>}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {visible.map((ev) => (
            <article
              key={ev.id}
              style={{
                position: 'relative',
                minHeight: 230,
                borderRadius: 24,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                overflow: 'hidden',
                background: gradientFor(ev.category),
              }}
            >
              {/* dark fade so text stays readable */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15,7,34,0.85) 10%, rgba(15,7,34,0) 70%)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  fontSize: 12,
                  background: '#ede9fe',
                  color: '#1a0b3b',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontWeight: 500,
                }}
              >
                {capitalize(ev.category)}
              </span>
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, margin: '0 0 6px' }}>{ev.title}</h2>
                <p style={{ fontSize: 13, opacity: 0.85, margin: '2px 0' }}>{ev.capacity} seats</p>
                <p style={{ fontSize: 13, opacity: 0.85, margin: '2px 0' }}>{formatDate(ev.start_time)}</p>
                <p style={{ fontSize: 13, opacity: 0.85, margin: '2px 0 14px' }}>
                  {ev.venue}, {ev.location}
                </p>
                <button
                  type="button"
                  disabled
                  title="RSVP is a separate story"
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    borderRadius: 999,
                    border: 'none',
                    background: 'rgba(30, 14, 70, 0.9)',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  View Details &amp; RSVP
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}