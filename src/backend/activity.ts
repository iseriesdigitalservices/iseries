import "server-only"; // backend only — never bundled into the browser
import { cols, ObjectId } from "@/backend/mongo";
import { clientIp, userAgent } from "@/backend/security";

/** Records something a user (or the admin on a user) did. Never throws. */
export async function logActivity(userId: string, type: string, detail?: string | null, req?: Request) {
  try {
    const { activity } = await cols();
    await activity.insertOne({
      _id: new ObjectId(),
      userId,
      type,
      detail: detail ?? null,
      ip: req ? clientIp(req) : null,
      ua: req ? userAgent(req) : null,
      at: new Date(),
    });
  } catch (e) {
    console.error("[activity]", e);
  }
}

export const ACTIVITY_LABEL: Record<string, string> = {
  register: "Registered an account",
  login: "Logged in",
  login_failed: "Failed login attempt",
  logout: "Logged out",
  profile_update: "Updated profile",
  password_change: "Changed password",
  password_reset_requested: "Requested a password reset code",
  password_reset_done: "Reset password with email code",
  order_placed: "Placed an order",
  slip_resubmitted: "Re-uploaded payment slip",
  admin_status: "Admin changed account status",
  admin_password_set: "Admin set a new password",
  admin_viewed_password: "Admin viewed password",
};
