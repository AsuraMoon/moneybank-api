-- ============================================================
-- TABLE: users
-- Contient les utilisateurs de la plateforme
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,                         -- Identifiant unique
  email TEXT UNIQUE NOT NULL,                    -- Email unique
  password_hash TEXT NOT NULL,                   -- Mot de passe hashé (bcrypt)
  name TEXT,                                     -- Nom affiché
  twofa_enabled BOOLEAN DEFAULT FALSE,           -- 2FA activée ?
  twofa_secret TEXT,                             -- Secret TOTP
  created_at TIMESTAMPTZ DEFAULT now()           -- Date de création
);

-- ============================================================
-- TABLE: login_otps
-- OTP temporaires
-- ============================================================
CREATE TABLE IF NOT EXISTS login_otps (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,              -- id Supabase auth
  code TEXT NOT NULL,                 -- OTP (6 chiffres)
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,    -- expiration (ex: +10 minutes)
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_login_otps_user ON login_otps(user_id);

-- ============================================================
-- TABLE: accounts
-- Comptes bancaires liés à un utilisateur
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,                         -- Identifiant du compte
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                 -- Propriétaire du compte
  iban TEXT UNIQUE NOT NULL,                     -- IBAN unique
  balance BIGINT NOT NULL DEFAULT 0,             -- Solde en centimes (BIGINT = safe)
  created_at TIMESTAMPTZ DEFAULT now()           -- Date de création
);

-- ============================================================
-- TABLE: transactions
-- Historique des transferts entre comptes
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,                         -- Identifiant de la transaction
  from_account INTEGER REFERENCES accounts(id),  -- Compte source
  to_account INTEGER REFERENCES accounts(id),    -- Compte destination
  amount BIGINT NOT NULL,                        -- Montant en centimes
  label TEXT,                                    -- Libellé (ex: "Transfer")
  created_at TIMESTAMPTZ DEFAULT now()           -- Date de création
);

-- ============================================================
-- TABLE: audit_logs
-- Journalisation des actions sensibles
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,                         -- Identifiant du log
  user_id INTEGER,                               -- Utilisateur concerné (optionnel)
  action TEXT NOT NULL,                          -- Type d'action (INSERT, UPDATE...)
  meta JSONB,                                    -- Données associées
  created_at TIMESTAMPTZ DEFAULT now()           -- Date du log
);

-- ============================================================
-- INDEXES
-- Optimisation des requêtes fréquentes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_account);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_account);

-- ============================================================
-- FUNCTION: transfer_money
-- Transfert ACID entre deux comptes
-- ============================================================

CREATE OR REPLACE FUNCTION transfer_money(
  p_from INTEGER,                                -- Compte source
  p_to INTEGER,                                  -- Compte destination
  p_amount BIGINT                                -- Montant en centimes
  p_amount BIGINT                                -- Montant en centimes
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que le montant est positif
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Verrouillage pour éviter les doubles dépenses
  PERFORM pg_advisory_xact_lock(p_from);
  PERFORM pg_advisory_xact_lock(p_to);

  -- Débiter le compte source si solde suffisant
  UPDATE accounts
  SET balance = balance - p_amount
  WHERE id = p_from AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient funds or invalid source account';
  END IF;

  -- Créditer le compte destination
  UPDATE accounts
  SET balance = balance + p_amount
  WHERE id = p_to;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid destination account';
  END IF;

  -- Enregistrer la transaction
  INSERT INTO transactions (from_account, to_account, amount, label)
  VALUES (p_from, p_to, p_amount, 'Transfer');

END;
$$;

-- ============================================================
-- FUNCTION: log_transaction
-- Ajoute une entrée dans audit_logs après chaque transaction
-- ============================================================

CREATE OR REPLACE FUNCTION log_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, meta)
  VALUES (
    NULL,                                         -- Tu peux mettre NEW.user_id si tu veux
    TG_TABLE_NAME || ' ' || TG_OP,               -- Exemple: "transactions INSERT"
    row_to_json(NEW)                             -- Données de la transaction
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER: trg_log_transaction
-- Déclenché après chaque INSERT dans transactions
-- ============================================================

CREATE TRIGGER trg_log_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction();
