import { NextResponse } from "next/server"
import { createServerClient } from "@/supabase/server"

function generateIBAN(userId: string) {
  const base = userId.replace(/-/g, "").slice(0, 10).toUpperCase()
  return `FR76${base}0000000000`
}

function generateInitialBalance() {
  const min = 5000 * 100   // 5000€
  const max = 50000 * 100  // 50000€
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function POST(req: Request) {
  const supabase = createServerClient()
  const body = await req.json()

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  // 
  console.log("ENV CHECK:", {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  // 1️⃣ Créer l'utilisateur Supabase
  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // pas d'email → on force la validation
    })

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: userError?.message || "Failed to create user" },
      { status: 400 }
    )
  }

  const user = userData.user

  // 2️⃣ Générer IBAN + solde initial
  const iban = generateIBAN(user.id)
  const initialBalance = generateInitialBalance()

  // 3️⃣ Créer le compte bancaire associé
  const { error: accountError } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      iban,
      balance: initialBalance,
    })

  if (accountError) {
    return NextResponse.json(
      { error: accountError.message },
      { status: 400 }
    )
  }

  // 4️⃣ Réponse finale
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    account: {
      iban,
      balance: initialBalance,
    },
  })
}