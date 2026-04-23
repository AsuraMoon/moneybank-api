// POST /api/v1/auth/otp/verify
// Vérification OTP + activation 2FA

import { NextResponse } from "next/server";
import { verifyTokenWithoutOTP } from "@/lib/auth/verifyTokenWithoutOTP";
import { supabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // Auth sans contrainte OTP (nécessaire pour valider l'OTP)
  const user = await verifyTokenWithoutOTP(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  // Lookup OTP actif pour l'utilisateur
  const { data: otp } = await supabase
    .from("login_otps")
    .select("*")
    .eq("user_id", user.id)
    .eq("code", code)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!otp) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  // Expiration OTP
  if (new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expired" }, { status: 400 });
  }

  // Marquage OTP consommé
  await supabase
    .from("login_otps")
    .update({ used: true })
    .eq("id", otp.id);

  // Activation 2FA
  await supabase.auth.updateUser({
    data: { otp_validated: true }
  });

  return NextResponse.json({ success: true });
}
