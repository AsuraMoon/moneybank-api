// ===============================================
// GET /api/v1/accounts
// Retourne tous les comptes bancaires de l'utilisateur
// ===============================================

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/verifyToken";
import { supabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  // Vérification du token
  const user = await verifyToken(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Récupération des comptes liés à l'utilisateur
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
