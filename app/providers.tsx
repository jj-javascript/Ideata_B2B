"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = new ConvexReactClient(
  convexUrl || "https://placeholder.convex.cloud"
);

export function Providers({ children }: { children: React.ReactNode }) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3a6ba9'},body:JSON.stringify({sessionId:'3a6ba9',runId:'railway-clerk-build',hypothesisId:'H4+H5',location:'app/providers.tsx:Providers',message:'Providers render env snapshot',data:{hasConvexUrl:!!convexUrl,convexPlaceholderUsed:!convexUrl,hasPublishableKey:!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,isPlaceholder:process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY==='pk_test_your_clerk_publishable_key'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
