import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    ownerId: v.id("users"),
  },
  returns: v.id("boards"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("boards", {
      title: args.title,
      ownerId: args.ownerId,
      elements: JSON.stringify([]),
    });
  },
});

const boardReturnFields = {
  _id: v.id("boards"),
  _creationTime: v.number(),
  title: v.string(),
  ownerId: v.id("users"),
  elements: v.string(),
  thumbnailUrl: v.optional(v.string()),
  priority: v.optional(
    v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
  ),
  shareToken: v.optional(v.string()),
};

export const get = query({
  args: { boardId: v.id("boards") },
  returns: v.union(v.object(boardReturnFields), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.boardId);
  },
});

export const list = query({
  args: { ownerId: v.id("users") },
  returns: v.array(v.object(boardReturnFields)),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .collect();
  },
});

export const listWithShareCounts = query({
  args: { ownerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("boards"),
      _creationTime: v.number(),
      title: v.string(),
      ownerId: v.id("users"),
      elements: v.string(),
      thumbnailUrl: v.optional(v.string()),
      priority: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
      ),
      shareToken: v.optional(v.string()),
      shareCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .collect();
    const result: Array<typeof boards[0] & { shareCount: number }> = [];
    for (const board of boards) {
      const shares = await ctx.db
        .query("boardShares")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      result.push({ ...board, shareCount: shares.length });
    }
    return result;
  },
});

export const listSharedWithMe = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("boards"),
      _creationTime: v.number(),
      title: v.string(),
      ownerId: v.id("users"),
      elements: v.string(),
      thumbnailUrl: v.optional(v.string()),
      priority: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
      ),
      shareToken: v.optional(v.string()),
      role: v.union(v.literal("viewer"), v.literal("editor")),
    })
  ),
  handler: async (ctx, args) => {
    const shares = await ctx.db
      .query("boardShares")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const boards: Array<{
      _id: (typeof shares)[0]["boardId"];
      _creationTime: number;
      title: string;
      ownerId: (typeof shares)[0]["userId"];
      elements: string;
      thumbnailUrl?: string;
      priority?: "low" | "medium" | "high";
      shareToken?: string;
      role: "viewer" | "editor";
    }> = [];
    for (const share of shares) {
      const board = await ctx.db.get(share.boardId);
      if (board) {
        boards.push({ ...board, role: share.role });
      }
    }
    return boards.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const save = mutation({
  args: {
    boardId: v.id("boards"),
    elements: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    await ctx.db.patch(args.boardId, { elements: args.elements });
    return null;
  },
});

export const updateTitle = mutation({
  args: {
    boardId: v.id("boards"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error("Board not found");
    await ctx.db.patch(args.boardId, { title: args.title });
    return null;
  },
});

export const remove = mutation({
  args: { boardId: v.id("boards") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    const shares = await ctx.db
      .query("boardShares")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const share of shares) {
      await ctx.db.delete(share._id);
    }
    const presenceRecords = await ctx.db
      .query("boardPresence")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const p of presenceRecords) {
      await ctx.db.delete(p._id);
    }
    await ctx.db.delete(args.boardId);
    return null;
  },
});

export const removeAllByOwner = mutation({
  args: { ownerId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    for (const board of boards) {
      const shares = await ctx.db
        .query("boardShares")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      for (const share of shares) {
        await ctx.db.delete(share._id);
      }
      const presenceRecords = await ctx.db
        .query("boardPresence")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      for (const p of presenceRecords) {
        await ctx.db.delete(p._id);
      }
      await ctx.db.delete(board._id);
    }
    return null;
  },
});

export const updatePriority = mutation({
  args: {
    boardId: v.id("boards"),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error("Board not found");
    await ctx.db.patch(args.boardId, { priority: args.priority ?? undefined });
    return null;
  },
});

function randomShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const generateShareLink = mutation({
  args: { boardId: v.id("boards") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error("Board not found");
    if (board.shareToken) return board.shareToken;
    const token = randomShareToken();
    await ctx.db.patch(args.boardId, { shareToken: token });
    return token;
  },
});

export const revokeShareLink = mutation({
  args: { boardId: v.id("boards") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error("Board not found");
    await ctx.db.patch(args.boardId, { shareToken: undefined });
    return null;
  },
});

export const getByShareToken = query({
  args: { shareToken: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("boards"),
      _creationTime: v.number(),
      title: v.string(),
      ownerId: v.id("users"),
      elements: v.string(),
      thumbnailUrl: v.optional(v.string()),
      priority: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
      ),
      shareToken: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();
    return board ?? null;
  },
});

export const addShare = mutation({
  args: {
    boardId: v.id("boards"),
    email: v.string(),
    role: v.union(v.literal("viewer"), v.literal("editor")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error("Board not found");
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (!user) throw new Error("No user found with that email");
    const existing = await ctx.db
      .query("boardShares")
      .withIndex("by_board_user", (q) =>
        q.eq("boardId", args.boardId).eq("userId", user._id)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
    } else {
      await ctx.db.insert("boardShares", {
        boardId: args.boardId,
        userId: user._id,
        role: args.role,
      });
    }
    return null;
  },
});

export const removeShare = mutation({
  args: {
    boardId: v.id("boards"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("boardShares")
      .withIndex("by_board_user", (q) =>
        q.eq("boardId", args.boardId).eq("userId", args.userId)
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

export const getShares = query({
  args: { boardId: v.id("boards") },
  returns: v.array(
    v.object({
      _id: v.id("boardShares"),
      userId: v.id("users"),
      userName: v.string(),
      userEmail: v.string(),
      role: v.union(v.literal("viewer"), v.literal("editor")),
    })
  ),
  handler: async (ctx, args) => {
    const shares = await ctx.db
      .query("boardShares")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    const result: Array<{
      _id: (typeof shares)[0]["_id"];
      userId: (typeof shares)[0]["userId"];
      userName: string;
      userEmail: string;
      role: (typeof shares)[0]["role"];
    }> = [];
    for (const share of shares) {
      const user = await ctx.db.get(share.userId);
      if (user) {
        result.push({
          _id: share._id,
          userId: share.userId,
          userName: user.name,
          userEmail: user.email,
          role: share.role,
        });
      }
    }
    return result;
  },
});

const PRESENCE_TTL_MS = 30_000;

export const updatePresence = mutation({
  args: {
    boardId: v.id("boards"),
    clerkId: v.string(),
    userName: v.string(),
    avatarUrl: v.optional(v.string()),
    color: v.string(),
    cursorX: v.optional(v.number()),
    cursorY: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lastActive = Date.now();
    const existing = await ctx.db
      .query("boardPresence")
      .withIndex("by_board_clerk", (q) =>
        q.eq("boardId", args.boardId).eq("clerkId", args.clerkId)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        userName: args.userName,
        avatarUrl: args.avatarUrl,
        color: args.color,
        cursorX: args.cursorX,
        cursorY: args.cursorY,
        lastActive,
      });
    } else {
      await ctx.db.insert("boardPresence", {
        boardId: args.boardId,
        clerkId: args.clerkId,
        userName: args.userName,
        avatarUrl: args.avatarUrl,
        color: args.color,
        cursorX: args.cursorX,
        cursorY: args.cursorY,
        lastActive,
      });
    }
    return null;
  },
});

export const getPresence = query({
  args: { boardId: v.id("boards") },
  returns: v.array(
    v.object({
      _id: v.id("boardPresence"),
      clerkId: v.string(),
      userName: v.string(),
      avatarUrl: v.optional(v.string()),
      color: v.string(),
      cursorX: v.optional(v.number()),
      cursorY: v.optional(v.number()),
      lastActive: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const cutoff = Date.now() - PRESENCE_TTL_MS;
    const all = await ctx.db
      .query("boardPresence")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    return all
      .filter((p) => p.lastActive >= cutoff)
      .map(({ _id, clerkId, userName, avatarUrl, color, cursorX, cursorY, lastActive }) => ({
        _id,
        clerkId,
        userName,
        avatarUrl,
        color,
        cursorX,
        cursorY,
        lastActive,
      }));
  },
});

export const removePresence = mutation({
  args: {
    boardId: v.id("boards"),
    clerkId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("boardPresence")
      .withIndex("by_board_clerk", (q) =>
        q.eq("boardId", args.boardId).eq("clerkId", args.clerkId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
