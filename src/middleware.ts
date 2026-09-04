export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/faculty/:path*", "/assignments/:path*"],
}
