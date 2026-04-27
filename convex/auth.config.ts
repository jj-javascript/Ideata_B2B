import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "convex",
      domain: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
      issuer: "https://your.issuer.url.com",
      jwks: "https://your.issuer.url.com/.well-known/jwks.json",
      algorithm: "RS256",
    },
  ],
};

