CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iban TEXT UNIQUE NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  from_account INTEGER REFERENCES accounts(id),
  to_account INTEGER REFERENCES accounts(id),
  amount BIGINT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
