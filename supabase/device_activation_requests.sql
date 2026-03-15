create table if not exists public.device_activation_requests (
    id uuid primary key default gen_random_uuid(),
    device_code text not null unique,
    poll_token_hash text not null,
    product_id text not null,
    machine_hash text not null,
    platform text,
    requested_at timestamptz not null default now(),
    expires_at timestamptz not null,
    status text not null default 'pending',
    customer_email text,
    license_id text,
    entitlement_id text,
    machine_id text,
    offline_grace_until timestamptz,
    license_clic text,
    claimed_at timestamptz
);

create index if not exists device_activation_requests_status_idx
    on public.device_activation_requests (status, expires_at desc);

create index if not exists device_activation_requests_product_idx
    on public.device_activation_requests (product_id, requested_at desc);
