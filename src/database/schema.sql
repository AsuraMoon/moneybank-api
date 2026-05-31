-- ============================================================
-- 🏦 TABLE : accounts
-- Chaque utilisateur possède un ou plusieurs comptes bancaires.
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,

  -- L'utilisateur propriétaire du compte
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- IBAN unique généré par ton backend
  iban TEXT UNIQUE NOT NULL,

  -- Solde du compte en centimes (BIGINT = évite les erreurs de float)
  balance BIGINT NOT NULL DEFAULT 0,

  -- Date de création
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer la sécurité RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 🔒 Policy : un utilisateur peut voir uniquement SES comptes
CREATE POLICY "Users can view their own accounts"
ON accounts FOR SELECT
USING (auth.uid() = user_id);

-- 🔒 Policy : empêcher les insertions directes depuis le client
CREATE POLICY "Users cannot insert accounts directly"
ON accounts FOR INSERT
WITH CHECK (false);

-- 🔒 Policy : empêcher les updates directes depuis le client
CREATE POLICY "Users cannot update accounts directly"
ON accounts FOR UPDATE
WITH CHECK (false);

-- 🔒 Policy : empêcher les suppressions directes
CREATE POLICY "Users cannot delete accounts directly"
ON accounts FOR DELETE
USING (false);



-- ============================================================
-- 💸 TABLE : transactions
-- Historique des transferts entre comptes.
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,

  -- Compte émetteur
  from_account INTEGER REFERENCES accounts(id),

  -- Compte destinataire
  to_account INTEGER REFERENCES accounts(id),

  -- Montant en centimes
  amount BIGINT NOT NULL,

  -- Libellé (ex : "Virement", "Achat", etc.)
  label TEXT,

  -- Date de création
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 🔒 Policy : un utilisateur peut voir uniquement SES transactions
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (
  -- Si l'utilisateur est propriétaire du compte émetteur
  auth.uid() = (
    SELECT user_id FROM accounts WHERE id = from_account
  )
  OR
  -- Ou propriétaire du compte destinataire
  auth.uid() = (
    SELECT user_id FROM accounts WHERE id = to_account
  )
);

-- 🔒 Policy : empêcher les insertions directes depuis le client
CREATE POLICY "Users cannot insert transactions directly"
ON transactions FOR INSERT
WITH CHECK (false);

-- 🔒 Policy : empêcher les updates directes
CREATE POLICY "Users cannot update transactions directly"
ON transactions FOR UPDATE
WITH CHECK (false);

-- 🔒 Policy : empêcher les suppressions directes
CREATE POLICY "Users cannot delete transactions directly"
ON transactions FOR DELETE
USING (false);
