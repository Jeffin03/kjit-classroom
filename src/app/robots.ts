import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/api/auth/", "/api/assignments/", "/api/submissions/", "/api/teams/", "/api/announcements/", "/api/roster/", "/api/org/", "/api/faculty/", "/dashboard/", "/faculty/", "/assignments/", "/teams/", "/profile/", "/signin/"],
      },
    ],
    sitemap: "https://3-109-190-247.sslip.io/sitemap.xml",
  }
}
