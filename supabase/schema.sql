-- LessMess schema for IIT Roorkee
-- Timezone for application logic: Asia/Kolkata

create extension if not exists "pgcrypto";

create table if not exists public.hostels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('admin', 'student')),
  hostel_id uuid not null references public.hostels (id)
);

create table if not exists public.weekly_menus (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels (id),
  week_start_date date not null,
  status text not null check (status in ('Draft', 'Published', 'Completed')),
  unique (hostel_id, week_start_date)
);

create table if not exists public.menu_versions (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.weekly_menus (id) on delete cascade,
  date date not null,
  meal_type text not null check (meal_type in ('Breakfast', 'Lunch', 'Dinner')),
  dishes text[] not null default '{}',
  is_locked boolean not null default false,
  unique (menu_id, date, meal_type)
);

create table if not exists public.menu_version_history (
  id uuid primary key default gen_random_uuid(),
  menu_version_id uuid not null references public.menu_versions (id) on delete cascade,
  dishes text[] not null,
  changed_at timestamptz not null default timezone('Asia/Kolkata', now()),
  changed_by uuid references public.users (id)
);

create table if not exists public.pre_meal_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id),
  menu_version_id uuid not null references public.menu_versions (id) on delete cascade,
  dish_name text not null,
  rating integer not null check (rating between 1 and 5),
  likelihood_to_eat text not null check (
    likelihood_to_eat in (
      'Definitely eat',
      'Probably eat',
      'Unsure',
      'Probably skip',
      'Definitely skip'
    )
  ),
  reasons text[] not null default '{}',
  created_at timestamptz not null default timezone('Asia/Kolkata', now()),
  unique (student_id, menu_version_id, dish_name)
);

create table if not exists public.post_meal_kiosk_feedback (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels (id),
  date date not null,
  meal_type text not null check (meal_type in ('Breakfast', 'Lunch', 'Dinner')),
  dish_name text,
  issue text,
  status text not null check (status in ('Clean Plate', 'Leftover'))
);

create table if not exists public.meal_waste_logs (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels (id),
  date date not null,
  meal_type text not null check (meal_type in ('Breakfast', 'Lunch', 'Dinner')),
  actual_waste_kg numeric not null check (actual_waste_kg >= 0),
  unique (hostel_id, date, meal_type)
);

alter table public.hostels enable row level security;
alter table public.users enable row level security;
alter table public.weekly_menus enable row level security;
alter table public.menu_versions enable row level security;
alter table public.menu_version_history enable row level security;
alter table public.pre_meal_feedback enable row level security;
alter table public.post_meal_kiosk_feedback enable row level security;
alter table public.meal_waste_logs enable row level security;
