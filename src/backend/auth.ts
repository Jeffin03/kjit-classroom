import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(process.env.AUTH_URL ? { url: process.env.AUTH_URL } : {}),
  // Auth.js's built-in sign-in page is unstyled; the app ships its own at
  // /signin. Every sign-in entry point (including /api/auth/signin and OAuth
  // error returns) is redirected there, with callbackUrl/error appended.
  pages: {
    signIn: "/signin",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo read:org",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // Kept in the JWT only. Read server-side via getToken() in
        // services/permissions.ts. Never copy it onto `session` — Auth.js
        // serializes the session to the browser on /api/auth/session.
        ;(token as Record<string, unknown>).accessToken =
          account.access_token

        // The provider maps `name` to profile.name, which is the user's
        // display name. Authorization must key off the login, not the
        // display name, so capture it explicitly.
        const login = (profile as { login?: string } | undefined)?.login
        if (login) {
          ;(token as Record<string, unknown>).login = login
        }
      }
      return token
    },
  },
})
