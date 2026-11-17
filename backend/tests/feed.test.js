jest.mock('../src/lib/supabase', () => {
  const users = {
    'org-token': { id: 'org-1', app_metadata: { role: 'organizer' } },
    'att-token': { id: 'att-1', app_metadata: { role: 'attendee' } },
  };

  // Chainable query builder: every method returns the builder,
  // and awaiting the builder resolves to the current result.
  let result = { data: [], error: null };
  const builder = {};
  ['select', 'eq', 'gte', 'lte', 'ilike', 'order', 'limit'].forEach((m) => {
    builder[m] = jest.fn(() => builder);
  });
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);

  return {
    __builder: builder,
    __setResult: (r) => {
      result = r;
    },
    auth: {
      getUser: async (t) =>
        users[t]
          ? { data: { user: users[t] }, error: null }
          : { data: { user: null }, error: { message: 'invalid' } },
    },
    from: jest.fn(() => builder),
  };
});

const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/lib/supabase');

const get = (query = '', token = 'att-token') => {
  const r = request(app).get(`/api/v1/events${query}`);
  return token ? r.set('Authorization', `Bearer ${token}`) : r;
};

beforeEach(() => {
  supabase.from.mockClear();
  Object.values(supabase.__builder).forEach((fn) => typeof fn.mockClear === 'function' && fn.mockClear());
  supabase.__setResult({ data: [], error: null });
});

describe('GET /api/v1/events (discovery feed)', () => {
  test('returns events with 200', async () => {
    const events = [
      { id: 'e1', title: 'Intro to React', status: 'active' },
      { id: 'e2', title: 'UI/UX Wireframing', status: 'active' },
    ];
    supabase.__setResult({ data: events, error: null });

    const res = await get();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(events);
  });

  test('only active, future events, ordered by start_time ascending', async () => {
    await get();
    const b = supabase.__builder;
    expect(supabase.from).toHaveBeenCalledWith('events');
    expect(b.eq).toHaveBeenCalledWith('status', 'active');
    expect(b.gte).toHaveBeenCalledWith('start_time', expect.any(String));
    expect(b.order).toHaveBeenCalledWith('start_time', { ascending: true });

    // the "future" cut-off is roughly now
    const cutoff = new Date(b.gte.mock.calls[0][1]).getTime();
    expect(Math.abs(cutoff - Date.now())).toBeLessThan(5000);
  });

  test('category filter is lower-cased and applied', async () => {
    await get('?category=TECH');
    expect(supabase.__builder.eq).toHaveBeenCalledWith('category', 'tech');
  });

  test('location filter uses a case-insensitive partial match', async () => {
    await get('?location=Clifton');
    expect(supabase.__builder.ilike).toHaveBeenCalledWith('location', '%Clifton%');
  });

  test('no filters -> no category, location or range conditions', async () => {
    await get();
    expect(supabase.__builder.ilike).not.toHaveBeenCalled();
    expect(supabase.__builder.lte).not.toHaveBeenCalled();
    const categoryCalls = supabase.__builder.eq.mock.calls.filter(([col]) => col === 'category');
    expect(categoryCalls).toHaveLength(0);
  });

  test('range=week adds an upper date limit about 7 days away', async () => {
    await get('?range=week');
    const [col, value] = supabase.__builder.lte.mock.calls[0];
    expect(col).toBe('start_time');
    const days = (new Date(value).getTime() - Date.now()) / (24 * 3600 * 1000);
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7.1);
  });

  test('range=today limits to the end of today', async () => {
    await get('?range=today');
    const value = supabase.__builder.lte.mock.calls[0][1];
    const end = new Date(value);
    expect(end.getTime()).toBeGreaterThanOrEqual(Date.now());
    expect(end.toDateString()).toBe(new Date().toDateString());
  });

  test('unknown range is ignored', async () => {
    await get('?range=forever');
    expect(supabase.__builder.lte).not.toHaveBeenCalled();
  });

  test('empty feed -> 200 with an empty list', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('organizers can also view the feed', async () => {
    expect((await get('', 'org-token')).status).toBe(200);
  });

  test('no token or bad token -> 401', async () => {
    expect((await get('', null)).status).toBe(401);
    expect((await get('', 'bad-token')).status).toBe(401);
  });

  test('database error -> 500, not a crash', async () => {
    supabase.__setResult({ data: null, error: { message: 'db down' } });
    const res = await get();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 500, message: expect.any(String) });
  });
});
