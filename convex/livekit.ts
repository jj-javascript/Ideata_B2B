"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { AccessToken } from "livekit-server-sdk";

export const getToken = action({
  args: {
    roomName: v.string(),
    participantName: v.string(),
    participantIdentity: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      throw new Error(
        "LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in Convex. " +
          "Go to your Convex dashboard (convex.dev) > Settings > Environment Variables, " +
          "then add LIVEKIT_API_KEY and LIVEKIT_API_SECRET from https://cloud.livekit.io"
      );
    }
    const token = new AccessToken(apiKey, apiSecret, {
      identity: args.participantIdentity,
      name: args.participantName,
    });
    token.addGrant({
      roomJoin: true,
      room: args.roomName,
      canPublish: true,
      canSubscribe: true,
    });
    return await token.toJwt();
  },
});
