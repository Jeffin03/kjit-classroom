import { NextResponse } from "next/server"
import { authenticate, toPublicAccess } from "@/backend/services/permissions"

export async function GET() {
  const result = await authenticate()

  if (!result.ok) return result.response

  return NextResponse.json(toPublicAccess(result.session.access))
}
