// ===============================================
// GET /api/v1/me
// Retourne les informations de l'utilisateur connecté
// ===============================================

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/verifyToken";

export async function GET(req: Request) {
  // Vérifie le JWT envoyé dans Authorization: Bearer <token>
  const user = await verifyToken(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // On renvoie uniquement les infos utiles
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name ?? null
  });
}
