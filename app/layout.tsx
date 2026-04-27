import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ideata — Collaborative B2B Brainstorming",
  description: "Turn team ideas into outcomes. Ideata is the collaborative workspace for B2B brainstorming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3a6ba9'},body:JSON.stringify({sessionId:'3a6ba9',runId:'railway-clerk-build',hypothesisId:'H1+H2+H3',location:'app/layout.tsx:RootLayout',message:'Build-time Clerk env inspection',data:{hasPublishableKey:!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,isPlaceholder:process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY==='pk_test_your_clerk_publishable_key',startsWithPkTest:(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY||'').startsWith('pk_test_'),keyLength:(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY||'').length,hasSecretKey:!!process.env.CLERK_SECRET_KEY},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
