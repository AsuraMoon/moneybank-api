import { supabase } from "@/lib/supabase/server";

export async function verifyToken(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const token = auth.replace("Bearer ", "");

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  // 🔐 Vérifie que l'OTP a été validé
  if (!user.user_metadata?.otp_validated) {
    return null;
  }

  return user;
}
