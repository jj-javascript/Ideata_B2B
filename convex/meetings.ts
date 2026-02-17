import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const meetingValidator = v.object({
  _id: v.id("meetings"),
  _creationTime: v.number(),
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
});

export const schedule = mutation({
  args: {
    title: v.string(),
    hostId: v.id("users"),
    boardId: v.optional(v.id("boards")),
    scheduledAt: v.number(),
    durationMinutes: v.number(),
    platform: v.optional(
      v.union(
        v.literal("livekit"),
        v.literal("zoom"),
        v.literal("google_meet")
      )
    ),
    externalLink: v.optional(v.string()),
  },
  returns: v.id("meetings"),
  handler: async (ctx, args) => {
    const platform = args.platform ?? "livekit";
    return await ctx.db.insert("meetings", {
      title: args.title,
      hostId: args.hostId,
      boardId: args.boardId,
      scheduledAt: args.scheduledAt,
      durationMinutes: args.durationMinutes,
      platform,
      externalLink: args.externalLink,
      status: "scheduled",
    });
  },
});

export const list = query({
  args: { hostId: v.id("users") },
  returns: v.array(meetingValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetings")
      .withIndex("by_host", (q) => q.eq("hostId", args.hostId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { meetingId: v.id("meetings") },
  returns: v.union(meetingValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.meetingId);
  },
});

export const join = mutation({
  args: {
    meetingId: v.id("meetings"),
    userId: v.id("users"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }
    const wasScheduled = meeting.status === "scheduled";
    const roomName = `ideata-meeting-${args.meetingId}`;
    await ctx.db.patch(args.meetingId, {
      status: "active",
      livekitRoom: roomName,
    });
    const existing = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!existing) {
      await ctx.db.insert("meetingParticipants", {
        meetingId: args.meetingId,
        userId: args.userId,
      });
    }
    if (wasScheduled) {
      const invites = await ctx.db
        .query("meetingInvites")
        .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
        .filter((q) => q.eq(q.field("notifiedStart"), false))
        .collect();
      const baseUrl = process.env.APP_URL ?? "";
      const meetingUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/meeting/${args.meetingId}` : "";
      for (const inv of invites) {
        if (meetingUrl) {
          await ctx.scheduler.runAfter(0, api.email.sendMeetingStartedEmail, {
            to: inv.email,
            meetingTitle: meeting.title,
            meetingUrl,
          });
        }
        await ctx.db.patch(inv._id, { notifiedStart: true });
      }
    }
    return roomName;
  },
});

export const end = mutation({
  args: { meetingId: v.id("meetings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }
    await ctx.db.patch(args.meetingId, { status: "ended" });
    return null;
  },
});

export const addParticipant = mutation({
  args: {
    meetingId: v.id("meetings"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!existing) {
      await ctx.db.insert("meetingParticipants", {
        meetingId: args.meetingId,
        userId: args.userId,
      });
    }
    return null;
  },
});

export const removeParticipant = mutation({
  args: {
    meetingId: v.id("meetings"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (participant) {
      await ctx.db.delete(participant._id);
    }
    return null;
  },
});
