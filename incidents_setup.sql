-- Create the incidents table
create table public.incidents (
  incident_id uuid default gen_random_uuid() primary key,
  incident_type text check (incident_type in ('Flood', 'Fire', 'Accident')) not null,
  latitude float not null,
  longitude float not null,
  reported_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- AI Intelligence
  severity_level int check (severity_level between 1 and 5),
  priority_score int,
  flood_risk_percentage float check (flood_risk_percentage between 0 and 100),
  
  -- Escalation State
  current_state text check (current_state in ('Monitoring', 'Preparedness', 'Crisis')) default 'Monitoring',
  
  -- Connectivity
  network_status text check (network_status in ('Online', 'Offline')) default 'Online',
  satellite_sos_required boolean default false,
  
  -- Admin Acknowledgment
  admin_acknowledged boolean default false,
  acknowledged_at timestamp with time zone,
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.incidents enable row level security;

-- Create policies (Adjust based on auth requirements, here allowing public read/write for hackathon speed)
create policy "Allow public read access" on public.incidents for select using (true);
create policy "Allow public insert access" on public.incidents for insert with check (true);
create policy "Allow public update access" on public.incidents for update using (true);
