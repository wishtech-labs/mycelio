import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // XSS protection
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // AGPL Source Code Link (compliance)
          { key: "X-Source-Code", value: "https://github.com/wishtech-labs/mycelio-hub" },
          // HSTS (only in production)
          ...(process.env.NODE_ENV === 'production' ? [
            { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }
          ] : []),
          // Permissions policy
          { 
            key: "Permissions-Policy", 
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" 
          },
        ],
      },
      {
        // API routes specific headers
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ]
  },
  
  // Security configurations
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Disable image optimization if not needed (reduces attack surface)
  // images: { unoptimized: true },
}

export default nextConfig
