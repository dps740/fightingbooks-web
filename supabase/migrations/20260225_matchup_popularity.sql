-- Track click-through popularity for /battles links
-- Used to power data-driven "Most Popular Battles" rankings.

create table if not exists public.matchup_popularity (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  animal_a text not null,
  animal_b text not null,
  clicks integer not null default 0,
  last_clicked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matchup_popularity_clicks_idx
  on public.matchup_popularity (clicks desc);

create index if not exists matchup_popularity_last_clicked_idx
  on public.matchup_popularity (last_clicked_at desc);

create or replace function public.update_matchup_popularity_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_matchup_popularity_updated_at on public.matchup_popularity;
create trigger trg_matchup_popularity_updated_at
before update on public.matchup_popularity
for each row
execute procedure public.update_matchup_popularity_updated_at();
