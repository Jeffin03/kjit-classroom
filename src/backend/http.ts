import { NextResponse } from "next/server"
import { cleanString, cleanStringList } from "./validation"

export { cleanString, cleanStringList }

/**
 * Reads and parses a JSON request body. Returns null when the body is missing
 * or malformed, so route handlers can answer 400 instead of leaking a 500 from
 * an unhandled `request.json()` rejection.
 */
export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
