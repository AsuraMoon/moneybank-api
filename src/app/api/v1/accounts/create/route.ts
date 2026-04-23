// ===============================================
// POST /api/v1/accounts/create
// Crée un nouveau compte bancaire pour l'utilisateur
// ===============================================

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/verifyToken";
import { supabase } from "@/lib/supabase/server";

// Génération d'un IBAN simplifié (mock)
function generateIBAN() {
  return "FR" + Math.floor(100000000000000000000 + Math.random() * 900000000000000000000);
}

export async function POST(req: Request) {
  // Vérification du token
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Génération d'un IBAN unique
  const iban = generateIBAN();

  // Création du compte en base
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      iban,
      balance: 0
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
