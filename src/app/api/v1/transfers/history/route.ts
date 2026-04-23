// GET /api/v1/transfers/history
// Historique des transferts de l'utilisateur

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/verifyToken";
import { supabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
