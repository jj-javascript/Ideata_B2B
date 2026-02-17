"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

export const generateVisual = action({
  args: {
    transcribedText: v.string(),
  },
  returns: v.object({
    storageId: v.id("_storage"),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a creative assistant. Given a brainstormed idea, produce a short, vivid image description suitable for DALL-E 3. Output only the image description, no other text. Keep it under 400 characters.",
        },
        {
          role: "user",
          content: args.transcribedText,
        },
      ],
    });
    const description =
      completion.choices[0]?.message?.content?.trim() || args.transcribedText;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: description,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });
    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    const imageBlob = await fetch(imageUrl).then((r) => r.blob());
    const storageId = await ctx.storage.store(new Blob([imageBlob]));
    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      throw new Error("Failed to get storage URL");
    }
    return { storageId, url };
  },
});
