require('dns').setDefaultResultOrder('ipv4first');
require('net').setDefaultAutoSelectFamily(false);
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// ---------- network retry ----------
// Retries failed connections (timeouts) instead of crashing the whole seed
async function retryFetch(url, options, attempt = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (attempt >= 10) throw err;
    console.log(`  network hiccup, retrying (${attempt}/10)...`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
    return retryFetch(url, options, attempt + 1);
  }
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: retryFetch },
  }
);

const PASSWORD = 'Password123!';
const WITH_LOAD_USERS = process.argv.includes('--load');

// ---------- helpers ----------
function must(result, label) {
  if (result.error) {
    console.error(`Failed: ${label}`);
    throw result.error;
  }
  return result.data;
}

// A date relative to now, at a given hour (local time)
function when(daysFromNow, hour, durationHours = 2) {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { start_time: start.toISOString(), end_time: end.toISOString() };
}

async function getOrCreateUser({ email, full_name, role }) {
  const created = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name },
  });
  if (!created.error) return created.data.user.id;

  // User already exists (from an earlier run): find them
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) throw list.error;
  const found = list.data.users.find((u) => u.email === email);
  if (!found) throw created.error;
  return found.id;
}

// ---------- people ----------
const organizers = [
  { email: 'organizer1@example.com', full_name: 'Hamza Rauf', role: 'organizer', organization_name: 'Karachi Arts Society' },
  { email: 'organizer2@example.com', full_name: 'Nida Farooq', role: 'organizer', organization_name: 'IBA Tech Club' },
  // Organizer with zero events, for the empty dashboard test
  { email: 'organizer3@example.com', full_name: 'Imran Qureshi', role: 'organizer', organization_name: 'New Org (no events)' },
];

const attendees = [
  { email: 'alice@example.com', full_name: 'Alice (Attendee A)', role: 'attendee' },
  { email: 'bilal@example.com', full_name: 'Bilal (Attendee B, no RSVPs)', role: 'attendee' },
  { email: 'sara@example.com', full_name: 'Sara Malik', role: 'attendee' },
  { email: 'omar@example.com', full_name: 'Omar Siddiqui', role: 'attendee' },
  { email: 'zainab@example.com', full_name: 'Zainab Ali', role: 'attendee' },
];

// ---------- main ----------
async function main() {
  console.log('Creating users...');
  const ids = {};
  for (const p of [...organizers, ...attendees]) {
    ids[p.email] = await getOrCreateUser(p);
    must(
      await supabase.from('profiles').upsert(
        {
          id: ids[p.email],
          full_name: p.full_name,
          email: p.email,
          role: p.role,
          organization_name: p.organization_name || null,
        },
        { onConflict: 'id' }
      ),
      `profile ${p.email}`
    );
    console.log(`  ok: ${p.email}`);
  }

  // Optional: 25 extra attendees for the concurrency test
  // Run with:  node scripts/seed.js --load
  if (WITH_LOAD_USERS) {
    console.log('Creating 25 load-test attendees...');
    for (let i = 1; i <= 25; i++) {
      const email = `load${i}@example.com`;
      const id = await getOrCreateUser({ email, full_name: `Load User ${i}`, role: 'attendee' });
      must(
        await supabase.from('profiles').upsert(
          { id, full_name: `Load User ${i}`, email, role: 'attendee' },
          { onConflict: 'id' }
        ),
        `profile ${email}`
      );
    }
  }

  console.log('Clearing old seed events and RSVPs...');
  const orgIds = organizers.map((o) => ids[o.email]);
  const old = must(
    await supabase.from('events').select('id').in('organizer_id', orgIds),
    'list old events'
  );
  const oldIds = old.map((e) => e.id);
  if (oldIds.length) {
    must(await supabase.from('rsvps').delete().in('event_id', oldIds), 'delete old rsvps');
    must(await supabase.from('events').delete().in('id', oldIds), 'delete old events');
  }

  console.log('Creating events...');
  const org1 = ids['organizer1@example.com'];
  const org2 = ids['organizer2@example.com'];

  const named = [
    { organizer_id: org1, title: 'Qawali Night', description: 'An evening of live qawali music.', venue: 'Arts Council', location: 'Clifton', capacity: 100, category: 'music', ...when(7, 20, 3) },
    { organizer_id: org1, title: 'Football Meetup', description: 'Friendly five-a-side football.', venue: 'Sports Complex', location: 'DHA', capacity: 30, category: 'sports', ...when(5, 17) },
    { organizer_id: org2, title: 'Web Dev Workshop', description: 'Hands-on intro to web development.', venue: 'IBA Campus', location: 'Gulshan', capacity: 40, category: 'workshops', ...when(9, 15), status: 'cancelled' },
    { organizer_id: org2, title: 'Sold Out Comedy Night', description: 'Stand-up comedy. Fully booked.', venue: 'Comedy Club', location: 'Clifton', capacity: 3, category: 'music', ...when(10, 21) },
    { organizer_id: org1, title: 'Past Cricket Match', description: 'A match that already took place.', venue: 'National Stadium', location: 'Gulshan', capacity: 50, category: 'sports', ...when(-7, 16, 4) },
    { organizer_id: org2, title: 'Past Photography Walk', description: 'A walk that already took place.', venue: 'Old City', location: 'Saddar', capacity: 20, category: 'workshops', ...when(-3, 9, 3) },
  ];

  // 30 filler future events, so the feed has 30+ active events in total
  const FILLER_COUNT = 30;
  const categories = ['music', 'sports', 'workshops', 'food', 'tech'];
  const locations = ['Clifton', 'DHA', 'Gulshan', 'Bahria Town', 'Saddar'];
  const filler = [];
  for (let i = 1; i <= FILLER_COUNT; i++) {
    filler.push({
      organizer_id: i % 2 === 0 ? org1 : org2,
      title: `${categories[i % 5]} meetup #${i}`,
      description: `Sample ${categories[i % 5]} event number ${i}.`,
      venue: `Venue ${i}`,
      location: locations[i % 5],
      capacity: 25 + i,
      category: categories[i % 5],
      ...when(i + 2, 10 + (i % 8)),
    });
  }

  const inserted = must(
    await supabase
      .from('events')
      .insert([...named, ...filler].map((e) => ({ status: 'active', ...e })))
      .select('id, title'),
    'insert events'
  );
  const eventId = (title) => inserted.find((e) => e.title === title).id;

  console.log('Creating RSVPs...');
  const rsvp = (email, title, status = 'confirmed') => ({
    attendee_id: ids[email],
    event_id: eventId(title),
    status,
  });

  const rsvps = [
    // Attendee A: active RSVP, RSVP on a cancelled event, and a self-cancelled RSVP
    rsvp('alice@example.com', 'Qawali Night'),
    rsvp('alice@example.com', 'Web Dev Workshop'),
    rsvp('alice@example.com', 'Football Meetup', 'cancelled'),
    // Attendee B (bilal) deliberately has none

    // Other attendees
    rsvp('sara@example.com', 'Qawali Night'),
    rsvp('omar@example.com', 'Qawali Night'),
    rsvp('zainab@example.com', 'Football Meetup'),
    rsvp('sara@example.com', 'Web Dev Workshop'),

    // Full event: capacity 3, three confirmed RSVPs
    rsvp('sara@example.com', 'Sold Out Comedy Night'),
    rsvp('omar@example.com', 'Sold Out Comedy Night'),
    rsvp('zainab@example.com', 'Sold Out Comedy Night'),

    // Past events
    rsvp('sara@example.com', 'Past Cricket Match'),
    rsvp('omar@example.com', 'Past Cricket Match'),
    rsvp('zainab@example.com', 'Past Photography Walk'),
  ];
  must(await supabase.from('rsvps').insert(rsvps), 'insert rsvps');

  const activeUpcoming = filler.length + 3; // 30 filler + Qawali, Football, Sold Out
  console.log('\nSeed complete.');
  console.log(`  Users:  ${organizers.length} organizers, ${attendees.length} attendees${WITH_LOAD_USERS ? ' + 25 load users' : ''}`);
  console.log(`  Events: ${inserted.length} total (${activeUpcoming} active upcoming, 1 cancelled, 2 past, 1 of the active ones is full)`);
  console.log(`  RSVPs:  ${rsvps.length}`);
  console.log(`  All accounts use the password: ${PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});