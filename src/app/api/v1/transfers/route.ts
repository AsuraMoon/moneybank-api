// ===============================================
// POST /api/v1/transfers
// Effectue un transfert d'argent entre deux comptes
// Utilise la fonction SQL ACID transfer_money()
// ===============================================

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/verifyToken";
import { supabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // Vérification du token
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Lecture du body JSON
  const body = await req.json();
  const { from, to, amount } = body;

  // Vérification des champs obligatoires
  if (!from || !to || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Appel de la fonction SQL ACID
  const { error } = await supabase.rpc("transfer_money", {
    p_from: from,
    p_to: to,
    p_amount: amount
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
