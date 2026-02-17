"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendInviteEmail = action({
  args: {
    to: v.string(),
    meetingTitle: v.string(),
    scheduledAt: v.number(),
    meetingUrl: v.string(),
  },
  returns: v.union(v.object({ id: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "RESEND_API_KEY not set. Skipping invite email. Add it in Convex dashboard > Settings > Environment Variables."
      );
      return null;
    }
    const resend = new Resend(apiKey);
    const scheduledDate = new Date(args.scheduledAt).toLocaleString();
    const { data, error } = await resend.emails.send({
      from: "Ideata <onboarding@resend.dev>",
      to: [args.to],
      subject: `You're invited to: ${args.meetingTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #5d4e37;">You're invited to a meeting</h2>
          <p style="color: #5d4e37; font-size: 16px;">
            <strong>${args.meetingTitle}</strong>
          </p>
          <p style="color: #6b5b45; font-size: 14px;">
            Scheduled for: ${scheduledDate}
          </p>
          <p style="margin: 24px 0;">
            <a href="${args.meetingUrl}" style="display: inline-block; background: #5d4e37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Join meeting
            </a>
          </p>
          <p style="color: #8a7a5c; font-size: 12px;">
            This invitation was sent from Ideata.
          </p>
        </div>
      `,
    });
    if (error) {
      console.error("Resend invite email error:", error);
      return null;
    }
    return data;
  },
});

export const sendMeetingStartedEmail = action({
  args: {
    to: v.string(),
    meetingTitle: v.string(),
    meetingUrl: v.string(),
  },
  returns: v.union(v.object({ id: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "RESEND_API_KEY not set. Skipping meeting-started email. Add it in Convex dashboard > Settings > Environment Variables."
      );
      return null;
    }
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Ideata <onboarding@resend.dev>",
      to: [args.to],
      subject: `Meeting started: ${args.meetingTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #5d4e37;">Meeting has started</h2>
          <p style="color: #5d4e37; font-size: 16px;">
            <strong>${args.meetingTitle}</strong> is now active.
          </p>
          <p style="margin: 24px 0;">
            <a href="${args.meetingUrl}" style="display: inline-block; background: #5d4e37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Join now
            </a>
          </p>
          <p style="color: #8a7a5c; font-size: 12px;">
            This notification was sent from Ideata.
          </p>
        </div>
      `,
    });
    if (error) {
      console.error("Resend meeting-started email error:", error);
      return null;
    }
    return data;
  },
});
