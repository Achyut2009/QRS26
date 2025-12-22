import { Webhook } from "svix";
import { Request, Response } from "express";
import { db } from "@/db/index";
import { users } from "@/db/schema";

export const clerkWebhook = async (req: Request, res: Response) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;
  const payload = JSON.stringify(req.body);

  const headers = {
    "svix-id": req.headers["svix-id"] as string,
    "svix-timestamp": req.headers["svix-timestamp"] as string,
    "svix-signature": req.headers["svix-signature"] as string,
  };

  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    const evt: any = wh.verify(payload, headers);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const user = evt.data;

      await db
        .insert(users)
        .values({
          id: user.id, // Clerk userId
          email: user.email_addresses[0].email_address,
          firstName: user.first_name ?? "",
          lastName: user.last_name ?? "",
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: user.email_addresses[0].email_address,
            firstName: user.first_name ?? "",
            lastName: user.last_name ?? "",
            updatedAt: new Date(),
          },
        });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Webhook verification failed" });
  }
};
