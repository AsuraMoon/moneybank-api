// POST /api/v1/auth/otp/request
// Génération OTP + reset 2FA

import { NextResponse } from "next/server";
import { verifyTokenWithoutOTP } from "@/lib/auth/verifyTokenWithoutOTP";
import { supabase } from "@/lib/supabase/server";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  // Auth sans contrainte OTP (nécessaire pour initier la 2FA)
  const user = await verifyTokenWithoutOTP(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Reset 2FA
  await supabase.auth.updateUser({
    data: { otp_validated: false }
  });

  // Génération OTP
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Persist OTP
  await supabase.from("login_otps").insert({
    user_id: user.id,
    code,
    expires_at: expiresAt
  });

  // Envoi email à implémenter
  return NextResponse.json({ success: true, dev_code: code });
}
