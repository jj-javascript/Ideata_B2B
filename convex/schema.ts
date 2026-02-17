import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_clerk_id", ["clerkId"]),

  boards: defineTable({
    title: v.string(),
    ownerId: v.id("users"),
    elements: v.string(),
    thumbnailUrl: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high")
      )
    ),
    shareToken: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_share_token", ["shareToken"]),

  boardShares: defineTable({
    boardId: v.id("boards"),
    userId: v.id("users"),
    role: v.union(v.literal("viewer"), v.literal("editor")),
  })
    .index("by_board", ["boardId"])
    .index("by_user", ["userId"])
    .index("by_board_user", ["boardId", "userId"]),

  meetings: defineTable({
    title: v.string(),
    hostId: v.id("users"),
    boardId: v.optional(v.id("boards")),
    scheduledAt: v.number(),
    durationMinutes: v.number(),
    livekitRoom: v.optional(v.string()),
    platform: v.optional(
      v.union(
        v.literal("livekit"),
        v.literal("zoom"),
        v.literal("google_meet")
      )
    ),
    externalLink: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("ended")
    ),
  })
    .index("by_host", ["hostId"])
    .index("by_status", ["status"]),

  meetingParticipants: defineTable({
    meetingId: v.id("meetings"),
    userId: v.id("users"),
  }).index("by_meeting", ["meetingId"]),

  meetingInvites: defineTable({
    meetingId: v.id("meetings"),
    email: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    invitedAt: v.number(),
    notifiedStart: v.boolean(),
  })
    .index("by_meeting", ["meetingId"])
    .index("by_email", ["email"]),

  boardPresence: defineTable({
    boardId: v.id("boards"),
    clerkId: v.string(),
    userName: v.string(),
    avatarUrl: v.optional(v.string()),
    color: v.string(),
    cursorX: v.optional(v.number()),
    cursorY: v.optional(v.number()),
    lastActive: v.number(),
  })
    .index("by_board", ["boardId"])
    .index("by_board_clerk", ["boardId", "clerkId"]),
});
