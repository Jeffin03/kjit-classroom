import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

/**
 * GitHub App user-to-server tokens expire after 8 hours (classic OAuth App
 * tokens do not). Auth.js only stores the initial token, so without a refresh
 * every user's GitHub calls start failing mid-day. The `jwt` callback renews
 * the token shortly before it expires and drops it when renewal is impossible,
 * which makes the session read as signed out and sends the user back through
 * the OAuth flow.
 *
 * https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens
 */
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
const EXPIRY_SKEW_MS = 60_000

interface TokenFields {
  accessToken?: string
  refreshToken?: string
  /** Epoch milliseconds. */
  expiresAt?: number
}

async function refreshAccessToken(
  refreshToken: string
): Promise<TokenFields | null> {
  const clientId = process.env.AUTH_GITHUB_ID
  const clientSecret = process.env.AUTH_GITHUB_SECRET
  if (!clientId || !clientSecret) return null

  try {
    const res = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    })
    if (!res.ok) return null

    const data = (await res.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }
    if (!data.access_token) return null

    return {
      accessToken: data.access_token,
      // GitHub rotates the refresh token on every use.
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt:
        typeof data.expires_in === "number"
          ? Date.now() + data.expires_in * 1000
          : undefined,
    }
  } catch {
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js refuses to trust the Host header unless told to. Vercel enables
  // this automatically, but self-hosted / proxied deployments throw
  // UntrustedHost at sign-in without it.
  trustHost: true,
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
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      const claims = token as Record<string, unknown>

      if (account) {
        // Kept in the JWT only. Read server-side via getToken() in
        // services/permissions.ts. Never copy it onto `session` — Auth.js
        // serializes the session to the browser on /api/auth/session.
        claims.accessToken = account.access_token

        if (typeof account.refresh_token === "string") {
          claims.refreshToken = account.refresh_token
        }
        if (typeof account.expires_at === "number") {
          claims.expiresAt = account.expires_at * 1000
        } else if (typeof account.expires_in === "number") {
          claims.expiresAt = Date.now() + account.expires_in * 1000
        }

        // The provider maps `name` to profile.name, which is the user's
        // display name. Authorization must key off the login, not the
        // display name, so capture it explicitly.
        const login = (profile as { login?: string } | undefined)?.login
        if (login) {
          claims.login = login
        }
        return token
      }

      const expiresAt =
        typeof claims.expiresAt === "number" ? claims.expiresAt : null
      const refreshToken =
        typeof claims.refreshToken === "string" ? claims.refreshToken : null

      // Classic OAuth App tokens have no expiry; nothing to do.
      if (!expiresAt || Date.now() < expiresAt - EXPIRY_SKEW_MS) {
        return token
      }

      if (refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken)
        if (refreshed?.accessToken) {
          claims.accessToken = refreshed.accessToken
          if (refreshed.refreshToken) claims.refreshToken = refreshed.refreshToken
          if (refreshed.expiresAt) claims.expiresAt = refreshed.expiresAt
          return token
        }
      }

      // No usable token: blank it so `readSessionIdentity` treats the session
      // as signed out and the client re-authenticates instead of silently
      // calling GitHub with dead credentials.
      claims.accessToken = ""
      claims.expiresAt = undefined
      return token
    },
  },
})
