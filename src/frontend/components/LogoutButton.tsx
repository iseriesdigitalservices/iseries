"use client";

import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        window.location.assign("/");
      }}
      className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
    >
      <LogOut className="h-4 w-4" /> Logout
    </button>
  );
}
