-- ==========================================================================
-- WhatsAgent COD — Esquema do Banco de Dados (PostgreSQL / Supabase)
-- --------------------------------------------------------------------------
-- Como usar:
--   1. No Supabase, abra "SQL Editor".
--   2. Clique em "New query".
--   3. Cole TODO este arquivo.
--   4. Clique em "Run".
-- Pode rodar novamente sem problemas (é idempotente).
-- ==========================================================================

-- Extensões úteis --------------------------------------------------------
create extension if not exists "pgcrypto";

-- ==========================================================================
-- FUNÇÃO AUXILIAR: atualiza updated_at automaticamente
-- ==========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ==========================================================================
-- TABELA: profiles (1 linha por usuário logado)
-- ==========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cria o profile automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into public.agent_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.whatsapp_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================================================
-- TABELA: products
-- ==========================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  description text default '',
  regular_price numeric(12,2),
  promo_price numeric(12,2),
  current_offer text default '',
  benefits text default '',
  features text default '',
  usage_instructions text default '',
  target_audience text default '',
  not_for text default '',
  notes text default '',
  warranty text default '',
  delivery_estimate text default '',
  regions text default '',
  states text default '',
  cities text default '',
  payment_methods text default 'Dinheiro, Pix, Cartão',
  requires_upfront_payment boolean not null default false,
  cash_on_delivery boolean not null default true,
  payment_message text not null default 'Você não precisa pagar nada agora 😊 O pagamento é feito somente quando o produto chegar até você.',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_user on public.products(user_id);

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- TABELA: product_offers (várias ofertas por produto)
-- ==========================================================================
create table if not exists public.product_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null default '',            -- ex: "2 unidades"
  quantity integer not null default 1,
  price numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_offers_product on public.product_offers(product_id);
create index if not exists idx_offers_user on public.product_offers(user_id);

-- ==========================================================================
-- TABELA: product_images (armazenadas no Supabase Storage)
-- ==========================================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,     -- caminho dentro do bucket
  public_url text not null,       -- URL pública para exibir/enviar
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_images_product on public.product_images(product_id);
create index if not exists idx_images_user on public.product_images(user_id);

-- ==========================================================================
-- TABELA: faqs
-- ==========================================================================
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  question text not null default '',
  answer text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_faqs_user on public.faqs(user_id);

-- ==========================================================================
-- TABELA: objections
-- ==========================================================================
create table if not exists public.objections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  objection text not null default '',
  answer text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_objections_user on public.objections(user_id);

-- ==========================================================================
-- TABELA: agent_settings (1 linha por usuário)
-- ==========================================================================
create table if not exists public.agent_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  agent_active boolean not null default false,
  personality text not null default 'Você é um atendente comercial pelo WhatsApp.
Seu trabalho é conversar com clientes interessados no produto e ajudá-los a entender se o produto faz sentido para eles.
Converse de maneira natural, humana, simples e amigável.
Utilize mensagens curtas.
Evite mandar textos enormes.
Não despeje todas as informações de uma vez.
Responda primeiro exatamente aquilo que o cliente perguntou.
Quando fizer sentido, faça uma pergunta curta para continuar a conversa.
Seu objetivo é conduzir naturalmente o cliente até o pedido.
Este negócio trabalha principalmente com pagamento na entrega.
Quando for relevante, explique claramente que o cliente não precisa pagar antecipadamente e que o pagamento acontece somente quando o produto chega.
Use essa vantagem principalmente quando o cliente demonstrar: medo de golpe, medo de pagar antecipadamente, insegurança, dúvida sobre pagamento, intenção de compra.
Não repita essa informação em toda mensagem.
Nunca invente informações. Nunca invente preço. Nunca invente promoção. Nunca invente prazo. Nunca invente disponibilidade.
Nunca diga que entregamos em uma região caso ela não esteja cadastrada como atendida.
Nunca pressione excessivamente o cliente. Nunca crie escassez falsa.
Nunca diga que restam poucas unidades caso essa informação não exista no sistema.
Se você não souber alguma informação, diga que vai verificar com um atendente humano.
Nunca diga espontaneamente que você é uma inteligência artificial.
Caso o cliente pergunte diretamente se está falando com um robô ou IA, responda de forma transparente.
Respeite sempre o contexto da conversa.
Seu objetivo final é transformar um cliente interessado em um pedido confirmado.',
  tone text not null default 'Amigável',       -- Natural, Amigável, Profissional, Descontraído, Vendedor, Consultivo, Personalizado
  custom_tone text default '',
  response_length text not null default 'Curtas', -- Curtas, Médias, Detalhadas
  closing_rules text default '',
  extra_instructions text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_agent_updated on public.agent_settings;
create trigger trg_agent_updated before update on public.agent_settings
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- TABELA: whatsapp_settings (1 linha por usuário)
-- ==========================================================================
create table if not exists public.whatsapp_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_number_id text default '',
  business_account_id text default '',
  display_phone_number text default '',
  -- Token opcional por usuário. No MVP o padrão vem das variáveis de ambiente.
  -- Se preenchido aqui, deve ser tratado com cuidado (idealmente criptografado).
  access_token text default '',
  verify_token text default '',
  connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_whatsapp_updated on public.whatsapp_settings;
create trigger trg_whatsapp_updated before update on public.whatsapp_settings
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- TABELA: contacts
-- ==========================================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  name text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, phone)
);

create index if not exists idx_contacts_user on public.contacts(user_id);

drop trigger if exists trg_contacts_updated on public.contacts;
create trigger trg_contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- TABELA: conversations
-- ==========================================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null default 'bot',   -- bot | human
  last_message text default '',
  last_message_at timestamptz default now(),
  -- Estado do pedido em andamento (persistido para não depender só da IA)
  order_draft jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, contact_id)
);

create index if not exists idx_conversations_user on public.conversations(user_id);
create index if not exists idx_conversations_contact on public.conversations(contact_id);

drop trigger if exists trg_conversations_updated on public.conversations;
create trigger trg_conversations_updated before update on public.conversations
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- TABELA: messages
-- ==========================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null,                 -- customer | agent | human
  type text not null default 'text',  -- text | image | audio
  content text default '',
  media_url text default '',
  whatsapp_message_id text,           -- id da mensagem no WhatsApp (evita duplicidade)
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_user on public.messages(user_id);
-- Índice único para NUNCA processar a mesma mensagem duas vezes
create unique index if not exists idx_messages_wa_id
  on public.messages(whatsapp_message_id)
  where whatsapp_message_id is not null;

-- ==========================================================================
-- TABELA: orders
-- ==========================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  order_number serial,
  customer_name text default '',
  customer_phone text default '',
  postal_code text default '',
  street text default '',
  number text default '',
  complement text default '',
  neighborhood text default '',
  city text default '',
  state text default '',
  reference text default '',
  subtotal numeric(12,2) not null default 0,
  shipping_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text default '',
  payment_type text not null default 'cash_on_delivery',
  status text not null default 'draft',
  customer_confirmed boolean not null default false,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_conversation on public.orders(conversation_id);

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- TABELA: order_items
-- ==========================================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  offer_id uuid references public.product_offers(id) on delete set null,
  product_name text default '',
  offer_label text default '',
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_user on public.order_items(user_id);

-- ==========================================================================
-- TABELA: order_status_history
-- ==========================================================================
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_order_history_order on public.order_status_history(order_id);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário só enxerga os próprios dados.
-- O servidor (webhook) usa a chave service_role, que ignora o RLS.
-- ==========================================================================
alter table public.profiles              enable row level security;
alter table public.products              enable row level security;
alter table public.product_offers        enable row level security;
alter table public.product_images        enable row level security;
alter table public.faqs                  enable row level security;
alter table public.objections            enable row level security;
alter table public.agent_settings        enable row level security;
alter table public.whatsapp_settings     enable row level security;
alter table public.contacts              enable row level security;
alter table public.conversations         enable row level security;
alter table public.messages              enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_status_history  enable row level security;

-- profiles: usa a coluna id (que é o próprio user)
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Macro simples: políticas idênticas para tabelas com coluna user_id.
-- (Escritas explicitamente para clareza.)

drop policy if exists "products_own" on public.products;
create policy "products_own" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "offers_own" on public.product_offers;
create policy "offers_own" on public.product_offers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "images_own" on public.product_images;
create policy "images_own" on public.product_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "faqs_own" on public.faqs;
create policy "faqs_own" on public.faqs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "objections_own" on public.objections;
create policy "objections_own" on public.objections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "agent_own" on public.agent_settings;
create policy "agent_own" on public.agent_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "whatsapp_own" on public.whatsapp_settings;
create policy "whatsapp_own" on public.whatsapp_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "contacts_own" on public.contacts;
create policy "contacts_own" on public.contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "conversations_own" on public.conversations;
create policy "conversations_own" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages_own" on public.messages;
create policy "messages_own" on public.messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orders_own" on public.orders;
create policy "orders_own" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "order_items_own" on public.order_items;
create policy "order_items_own" on public.order_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "order_history_own" on public.order_status_history;
create policy "order_history_own" on public.order_status_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================================================
-- STORAGE: bucket para imagens do produto
-- ==========================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Políticas de Storage: usuário gerencia apenas a própria pasta (user_id/...)
drop policy if exists "product_images_read" on storage.objects;
create policy "product_images_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_insert" on storage.objects;
create policy "product_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "product_images_delete" on storage.objects;
create policy "product_images_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Fim do esquema.
