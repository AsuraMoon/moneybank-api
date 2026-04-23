import { supabase } from "@/lib/supabase/server";

export async function verifyTokenWithoutOTP(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const token = auth.replace("Bearer ", "");

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  // ❌ Pas de vérification OTP ici
  return user;
}
