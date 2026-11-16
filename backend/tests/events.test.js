jest.mock('../src/config/supabase', () => {
  const users = {
    'org-token': { id: 'org-1', app_metadata: { role: 'organizer' } },
    'att-token': { id: 'att-1', app_metadata: { role: 'attendee' } },
  };
  const insert = jest.fn((row) => ({
    select: () => ({ single: () => Promise.resolve({ data: { id: 'evt-1', ...row }, error: null }) }),
  }));
  return {
    __insert: insert,
    auth: {
      getUser: async (t) =>
        users[t]
          ? { data: { user: users[t] }, error: null }
          : { data: { user: null }, error: { message: 'invalid' } },
    },
    from: () => ({ insert }),
  };
});

const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/supabase');

const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const valid = () => ({
  title: 'Intro to React',
  description: 'Hands-on workshop',
  start_time: hoursFromNow(48),
  end_time: hoursFromNow(50),
  venue: 'Auditorium A',
  location: 'Clifton',
  capacity: 50,
  category: 'Tech',
});
const post = (body, token = 'org-token') => {
  const r = request(app).post('/api/v1/events');
  return (token ? r.set('Authorization', `Bearer ${token}`) : r).send(body);
};

// One fixed timestamp, so "end equals start" can never be flaky
const SAME_TIME = hoursFromNow(48);

beforeEach(() => supabase.__insert.mockClear());

describe('POST /api/v1/events', () => {
  test('valid event -> 201, active, organizer from token, category normalised', async () => {
    const res = await post({ ...valid(), organizer_id: 'hacker', status: 'cancelled' });
    expect(res.status).toBe(201);
    const row = supabase.__insert.mock.calls[0][0];
    expect(row.organizer_id).toBe('org-1');
    expect(row.status).toBe('active');
    expect(row.category).toBe('tech');
    expect(res.body.data.id).toBe('evt-1');
  });

  test('no token -> 401, attendee -> 403', async () => {
    expect((await post(valid(), null)).status).toBe(401);
    expect((await post(valid(), 'bad-token')).status).toBe(401);
    expect((await post(valid(), 'att-token')).status).toBe(403);
    expect(supabase.__insert).not.toHaveBeenCalled();
  });

  test.each([
    ['past start_time', { start_time: hoursFromNow(-5), end_time: hoursFromNow(-3) }],
    ['end before start', { end_time: hoursFromNow(47) }],
    ['end equals start', { start_time: SAME_TIME, end_time: SAME_TIME }],
    ['capacity 0', { capacity: 0 }],
    ['capacity -5', { capacity: -5 }],
    ['capacity 2.5', { capacity: 2.5 }],
    ['capacity as string', { capacity: '50' }],
    ['title 121 chars', { title: 'a'.repeat(121) }],
    ['whitespace-only title', { title: '   ' }],
    ['whitespace-only venue', { venue: '   ' }],
    ['empty description', { description: '' }],
    ['unknown category', { category: 'karaoke' }],
    ['bad date string', { start_time: 'tomorrow' }],
    ['numeric date', { start_time: 1893456000000 }],
  ])('%s -> 400 and nothing saved', async (_name, patch) => {
    const res = await post({ ...valid(), ...patch });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 400, message: expect.any(String) });
    expect(supabase.__insert).not.toHaveBeenCalled();
  });

  test.each(['title', 'description', 'start_time', 'end_time', 'venue', 'location', 'capacity', 'category'])(
    'missing %s -> 400',
    async (field) => {
      const body = valid();
      delete body[field];
      expect((await post(body)).status).toBe(400);
      expect(supabase.__insert).not.toHaveBeenCalled();
    }
  );

  test('boundaries: capacity 1 and 120-char title are accepted', async () => {
    expect((await post({ ...valid(), capacity: 1 })).status).toBe(201);
    expect((await post({ ...valid(), title: 'a'.repeat(120) })).status).toBe(201);
  });

  // Remove this test (or flip it to expect 400) if your validator rejects mixed-case categories
  test('category is case-insensitive', async () => {
    const res = await post({ ...valid(), category: 'TECH' });
    expect(res.status).toBe(201);
    expect(supabase.__insert.mock.calls[0][0].category).toBe('tech');
  });

  test('empty body and malformed JSON -> 400', async () => {
    expect((await post(undefined)).status).toBe(400);
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', 'Bearer org-token')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
  });

  // Assumes your route returns 500 on a database error; change the number if it returns something else
  test('database error -> 500, not a crash', async () => {
    supabase.__insert.mockImplementationOnce(() => ({
      select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'db down' } }) }),
    }));
    const res = await post(valid());
    expect(res.status).toBe(500);
  });
});