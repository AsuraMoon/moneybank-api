// GET /api/v1/audit
// Retourne les logs d'audit

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/verifyToken";
import { supabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  // Auth 2FA obligatoire
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch audit logs
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
