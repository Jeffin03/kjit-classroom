export { auth as middleware } from "@/backend/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/faculty/:path*", "/assignments/:path*"],
}
