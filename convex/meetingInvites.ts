import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const invite = mutation({
  args: {
    meetingId: v.id("meetings"),
    email: v.string(),
    baseUrl: v.string(),
  },
  returns: v.id("meetingInvites"),
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }
    const normalizedEmail = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("meetingInvites")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();
    if (existing) {
      throw new Error("This email is already invited to the meeting");
    }
    const inviteId = await ctx.db.insert("meetingInvites", {
      meetingId: args.meetingId,
      email: normalizedEmail,
      status: "pending",
      invitedAt: Date.now(),
      notifiedStart: false,
    });
    const meetingUrl = `${args.baseUrl.replace(/\/$/, "")}/meeting/${args.meetingId}`;
    await ctx.scheduler.runAfter(0, api.email.sendInviteEmail, {
      to: normalizedEmail,
      meetingTitle: meeting.title,
      scheduledAt: meeting.scheduledAt,
      meetingUrl,
    });
    return inviteId;
  },
});

export const listByMeeting = query({
  args: { meetingId: v.id("meetings") },
  returns: v.array(
    v.object({
      _id: v.id("meetingInvites"),
      _creationTime: v.number(),
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
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetingInvites")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .collect();
  },
});

export const removeInvite = mutation({
  args: { inviteId: v.id("meetingInvites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.inviteId);
    return null;
  },
});
