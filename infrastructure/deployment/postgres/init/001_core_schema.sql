-- Mojaly Core persistence schema.
-- This file is mounted into the Postgres container and runs when the database
-- volume is created for the first time.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  trading_name text,
  business_type text NOT NULL,
  country char(2) NOT NULL,
  owner_email text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
  kyb_status text NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (kyb_status IN ('NOT_SUBMITTED', 'SUBMITTED', 'APPROVED', 'REJECTED')),
  approved_at timestamptz,
  rejected_at timestamptz,
  suspended_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS workspaces_owner_email_idx ON workspaces (lower(owner_email));
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kratos_identity_id text NOT NULL UNIQUE,
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (lower(email));

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_memberships_user_idx ON workspace_memberships (user_id, status);
CREATE INDEX IF NOT EXISTS workspace_memberships_workspace_idx ON workspace_memberships (workspace_id, status);

CREATE TABLE IF NOT EXISTS workspace_kyb_submissions (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  registration_number text NOT NULL,
  tax_id text,
  registered_address text NOT NULL,
  operating_countries char(2)[] NOT NULL,
  website text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routing_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  rafiki_tenant_id uuid NOT NULL,
  adapter_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES routing_partners(id) ON DELETE CASCADE,
  country char(2) NOT NULL,
  destination_type text NOT NULL CHECK (destination_type IN ('mobile_money', 'bank_account')),
  network text,
  asset_code text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_capabilities_unique_idx
  ON partner_capabilities (partner_id, country, destination_type, COALESCE(network, ''), asset_code);

CREATE INDEX IF NOT EXISTS partner_capabilities_lookup_idx
  ON partner_capabilities (country, destination_type, COALESCE(network, ''), asset_code, status);

CREATE TABLE IF NOT EXISTS partner_supported_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES routing_partners(id) ON DELETE CASCADE,
  asset_code text NOT NULL,
  asset_scale integer NOT NULL CHECK (asset_scale >= 0 AND asset_scale <= 18),
  rafiki_asset_id uuid NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('bank_account', 'mobile_money')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, asset_code)
);

CREATE INDEX IF NOT EXISTS partner_supported_assets_lookup_idx
  ON partner_supported_assets (partner_id, asset_code, status);

CREATE TABLE IF NOT EXISTS partner_wallet_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES routing_partners(id) ON DELETE CASCADE,
  capability_id uuid NOT NULL REFERENCES partner_capabilities(id) ON DELETE CASCADE,
  wallet_address_url text NOT NULL UNIQUE,
  purpose text NOT NULL DEFAULT 'SETTLEMENT' CHECK (purpose IN ('SETTLEMENT')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  fintech_id text NOT NULL,
  name text NOT NULL,
  partner_code text NOT NULL REFERENCES routing_partners(code),
  external_partner_account_id text NOT NULL,
  rafiki_asset_id uuid,
  asset_code text NOT NULL,
  asset_scale integer NOT NULL CHECK (asset_scale >= 0 AND asset_scale <= 18),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_code, external_partner_account_id),
  UNIQUE (workspace_id, partner_code, asset_code, asset_scale)
);

CREATE INDEX IF NOT EXISTS accounts_workspace_idx ON accounts (workspace_id, status);
CREATE INDEX IF NOT EXISTS accounts_fintech_idx ON accounts (fintech_id, status);

CREATE TABLE IF NOT EXISTS wallet_addresses (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  fintech_id text NOT NULL,
  url text NOT NULL UNIQUE,
  public_name text NOT NULL,
  asset_code text NOT NULL,
  asset_scale integer NOT NULL CHECK (asset_scale >= 0 AND asset_scale <= 18),
  rafiki_asset_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_addresses_workspace_idx ON wallet_addresses (workspace_id, status);
CREATE INDEX IF NOT EXISTS wallet_addresses_account_idx ON wallet_addresses (account_id, status);

CREATE TABLE IF NOT EXISTS developer_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  wallet_address_id uuid NOT NULL REFERENCES wallet_addresses(id) ON DELETE CASCADE,
  rafiki_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS developer_keys_workspace_idx ON developer_keys (workspace_id, status);
CREATE INDEX IF NOT EXISTS developer_keys_wallet_address_idx ON developer_keys (wallet_address_id, status);

CREATE TABLE IF NOT EXISTS payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  fintech_id text NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  partner_code text NOT NULL REFERENCES routing_partners(code),
  destination_type text NOT NULL CHECK (destination_type IN ('bank_account', 'mobile_money')),
  destination_country char(2) NOT NULL,
  destination_account text NOT NULL,
  destination_bank_code text,
  destination_network text,
  destination_name text,
  amount_value text NOT NULL,
  amount_asset_code text NOT NULL,
  amount_asset_scale integer NOT NULL CHECK (amount_asset_scale >= 0 AND amount_asset_scale <= 18),
  reference text NOT NULL,
  wallet_address text NOT NULL,
  status text NOT NULL CHECK (status IN ('CREATED', 'AWAITING_PAYMENT', 'FUNDED', 'PAYOUT_SUBMITTED', 'COMPLETED', 'FAILED', 'EXPIRED')),
  adapter_payout_id uuid,
  failure_reason text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_intents_workspace_idx ON payment_intents (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_intents_fintech_idx ON payment_intents (fintech_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_intents_status_idx ON payment_intents (status, created_at DESC);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  wallet_address_id uuid REFERENCES wallet_addresses(id) ON DELETE SET NULL,
  payment_intent_id uuid REFERENCES payment_intents(id) ON DELETE SET NULL,
  asset_code text NOT NULL,
  asset_scale integer NOT NULL CHECK (asset_scale >= 0 AND asset_scale <= 18),
  value text NOT NULL,
  type text NOT NULL CHECK (type IN ('INCOMING', 'OUTGOING')),
  status text NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED', 'FAILED')),
  source text NOT NULL CHECK (source IN ('INTERLEDGER', 'PARTNER')),
  description text,
  partner_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_account_idx ON transactions (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_payment_intent_idx ON transactions (payment_intent_id);
CREATE INDEX IF NOT EXISTS transactions_payment_id_idx ON transactions (payment_id);

CREATE TABLE IF NOT EXISTS partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL,
  payment_intent_id uuid REFERENCES payment_intents(id) ON DELETE SET NULL,
  partner_code text NOT NULL,
  amount text NOT NULL,
  asset_code text NOT NULL,
  asset_scale integer NOT NULL CHECK (asset_scale >= 0 AND asset_scale <= 18),
  destination_type text NOT NULL CHECK (destination_type IN ('bank_account', 'mobile_money')),
  destination_account text NOT NULL,
  destination_bank_code text,
  customer_name text,
  reference text NOT NULL,
  status text NOT NULL CHECK (status IN ('RECEIVED', 'VALIDATED', 'SUBMITTED_TO_PARTNER', 'PENDING', 'COMPLETED', 'FAILED')),
  partner_reference text,
  failure_reason text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_payouts_payment_id_idx ON partner_payouts (payment_id);
CREATE INDEX IF NOT EXISTS partner_payouts_partner_reference_idx ON partner_payouts (partner_reference);
CREATE INDEX IF NOT EXISTS partner_payouts_status_idx ON partner_payouts (status, created_at DESC);

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('RAFIKI', 'GRIFFIN', 'MTN', 'SAFARICOM', 'KCB')),
  event_type text NOT NULL,
  external_event_id text,
  payment_intent_id uuid REFERENCES payment_intents(id) ON DELETE SET NULL,
  partner_payout_id uuid REFERENCES partner_payouts(id) ON DELETE SET NULL,
  signature_verified boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL,
  handled_at timestamptz,
  handling_status text NOT NULL DEFAULT 'RECEIVED' CHECK (handling_status IN ('RECEIVED', 'HANDLED', 'FAILED', 'IGNORED')),
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_event_id)
);

CREATE INDEX IF NOT EXISTS webhook_events_source_idx ON webhook_events (source, created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_events_status_idx ON webhook_events (handling_status, created_at DESC);

