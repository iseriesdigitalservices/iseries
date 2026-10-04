import type { UserStatus } from "@/backend/mongo";

export const USER_STATUS: Record<UserStatus, { label: string; cls: string; hint: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-800", hint: "Can log in and place orders" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800", hint: "Waiting for approval — cannot log in" },
  hold: { label: "On hold", cls: "bg-blue-100 text-blue-800", hint: "Temporarily blocked — cannot log in" },
  inactive: { label: "Deactivated", cls: "bg-red-100 text-red-800", hint: "Blocked — cannot log in" },
};

export const STATUS_ORDER: UserStatus[] = ["active", "pending", "hold", "inactive"];
