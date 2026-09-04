import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

declare module "next-auth" {
  interface Session {
    accessToken?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(process.env.AUTH_URL ? { url: process.env.AUTH_URL } : {}),
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
    async jwt({ token, account }) {
      if (account) {
        ;(token as Record<string, unknown>).accessToken =
          account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = (token as Record<string, unknown>)
        .accessToken as string
      return session
    },
  },

})
