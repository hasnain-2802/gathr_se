cat > database/schema.sql << 'EOF'
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('attendee','organizer')),
  organization_name text,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references profiles(id),
  title text not null check (char_length(title) <= 120),
  description text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  venue text not null,
  location text not null,
  capacity integer not null check (capacity > 0),
  category text not null,
  status text not null default 'active' check (status in ('active','cancelled')),
  created_at timestamptz default now(),
  check (end_time > start_time)
);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  attendee_id uuid not null references profiles(id),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz default now(),
  unique (event_id, attendee_id)
);

create index idx_events_organizer on events(organizer_id);
create index idx_events_start on events(start_time);
create index idx_rsvps_event on rsvps(event_id);
create index idx_rsvps_attendee on rsvps(attendee_id);

alter table profiles enable row level security;
alter table events enable row level security;
alter table rsvps enable row level security;
EOF