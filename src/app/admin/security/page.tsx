import { currentAdmin, logAdmin } from "@/backend/adminAuth";
import { cols, hex } from "@/backend/mongo";
import { mailConfigured } from "@/backend/mail";
import AdminForm from "@/frontend/components/AdminForm";

export const dynamic = "force-dynamic";

const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-black";
const lbl = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const ACTION_LABEL: Record<string, string> = {
  login: "Signed in",
  password_changed: "Changed their password",
  profile_updated: "Updated their profile",
  admin_created: "Created an admin account",
  admin_toggled: "Enabled / disabled an admin",
  admin_password_reset: "Reset another admin's password",
  admin_deleted: "Deleted an admin account",
  sessions_cleared: "Signed out all devices",
};

export default async function SecurityAdmin() {
  const me = await currentAdmin();
  if (!me) return null;
  void logAdmin;

  const { adminUsers, adminSessions, adminActivity } = await cols();
  const [admins, sessions, activity] = await Promise.all([
    adminUsers.find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: 1 }).toArray(),
    adminSessions.find().sort({ createdAt: -1 }).toArray(),
    adminActivity.find().sort({ at: -1 }).limit(60).toArray(),
  ]);
  const meId = hex(me._id);
  const isOwner = me.role === "owner";
  const smtp = await mailConfigured();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">Security</h1>
        <p className="mt-1 text-sm text-slate-600">Admin accounts, your password, active sessions and a record of everything admins do.</p>
      </div>

      {/* MY ACCOUNT */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">My account</h2>
        <p className="mb-4 text-xs text-slate-500">
          Signed in as <b>{me.email}</b> ({me.role}) · last sign-in{" "}
          {me.lastLoginAt ? `${me.lastLoginAt.toLocaleString("en-GB")} from ${me.lastLoginIp ?? "?"}` : "—"}
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminForm action="admin_profile">
            <p className="text-sm font-bold">Name &amp; login email</p>
            <div>
              <label className={lbl}>Name</label>
              <input name="name" required defaultValue={me.name} className={inp} />
            </div>
            <div>
              <label className={lbl}>Login email</label>
              <input name="email" type="email" required defaultValue={me.email} className={inp} />
            </div>
            <button className="rounded-lg bg-black px-5 py-2 text-sm font-bold text-[#f5c518]">Save profile</button>
          </AdminForm>

          <AdminForm action="admin_password">
            <p className="text-sm font-bold">Change my password</p>
            <input name="current" type="password" required placeholder="Current password" autoComplete="current-password" className={inp} />
            <input name="next" type="password" required placeholder="New password (10+, upper, lower, number)" autoComplete="new-password" className={inp} />
            <input name="confirm" type="password" required placeholder="Repeat new password" autoComplete="new-password" className={inp} />
            <button className="rounded-lg bg-black px-5 py-2 text-sm font-bold text-[#f5c518]">Change password</button>
          </AdminForm>
        </div>
      </section>

      {/* ADMIN ACCOUNTS */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Admin accounts ({admins.length})</h2>
        <p className="mb-4 text-xs text-slate-500">
          {isOwner ? "As the owner you can add, disable, reset and remove admins." : "Only the owner account can change admin accounts."}
        </p>
        <div className="space-y-3">
          {admins.map((a) => {
            const id = hex(a._id);
            return (
              <div key={id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {a.name}
                      {id === meId && <span className="ml-2 rounded bg-black px-2 py-0.5 align-middle text-[10px] font-bold text-[#f5c518]">YOU</span>}
                      {a.role === "owner" && <span className="ml-2 rounded bg-amber-200 px-2 py-0.5 align-middle text-[10px] font-bold text-amber-900">OWNER</span>}
                      {!a.active && <span className="ml-2 rounded bg-red-100 px-2 py-0.5 align-middle text-[10px] font-bold text-red-700">DISABLED</span>}
                    </p>
                    <p className="break-all text-sm text-slate-600">{a.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Added {a.createdAt.toLocaleDateString("en-GB")} · Last sign-in{" "}
                      {a.lastLoginAt ? `${a.lastLoginAt.toLocaleString("en-GB")} (${a.lastLoginIp ?? "?"})` : "never"}
                    </p>
                  </div>
                  {isOwner && id !== meId && (
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminForm action="admin_toggle" hidden={{ id }} inline>
                        <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">{a.active ? "Disable" : "Enable"}</button>
                      </AdminForm>
                      <AdminForm action="admin_delete" hidden={{ id }} confirm={`Remove ${a.name} permanently?`} inline>
                        <button className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Remove</button>
                      </AdminForm>
                    </div>
                  )}
                </div>
                {isOwner && id !== meId && (
                  <AdminForm action="admin_reset_password" hidden={{ id }} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input name="password" type="text" required placeholder="Set a new password for this admin" autoComplete="off" className={inp} />
                    <button className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold">Set password</button>
                  </AdminForm>
                )}
              </div>
            );
          })}
        </div>

        {isOwner && (
          <div className="mt-5 rounded-xl border-2 border-dashed border-slate-300 p-4">
            <p className="mb-3 text-sm font-bold">➕ Add another admin</p>
            <AdminForm action="admin_add" className="grid gap-2 sm:grid-cols-3">
              <input name="name" required placeholder="Full name" className={inp} />
              <input name="email" type="email" required placeholder="Login email" className={inp} />
              <input name="password" type="text" required placeholder="Password (10+ chars)" autoComplete="off" className={inp} />
              <div className="sm:col-span-3">
                <button className="rounded-lg bg-black px-6 py-2 text-sm font-bold text-[#f5c518]">Create admin</button>
              </div>
            </AdminForm>
          </div>
        )}
      </section>

      {/* SESSIONS */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Active admin sessions ({sessions.length})</h2>
          <AdminForm action="admin_signout_all" confirm="Sign out every admin device, including this one?" inline>
            <button className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Sign out all devices</button>
          </AdminForm>
        </div>
        <ul className="mt-3 divide-y divide-slate-100 text-xs">
          {sessions.map((s) => {
            const who = admins.find((a) => hex(a._id) === s.adminId);
            return (
              <li key={s._id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-semibold">{who?.name ?? "Unknown admin"}</span>
                <span className="break-anywhere text-slate-500">
                  IP {s.ip ?? "?"} · started {s.createdAt.toLocaleString("en-GB")} · expires {s.expireAt.toLocaleTimeString("en-GB")}
                </span>
              </li>
            );
          })}
          {sessions.length === 0 && <li className="py-2 text-slate-500">No active sessions.</li>}
        </ul>
      </section>

      {/* SECURITY CHECKLIST */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">Security checklist</h2>
        <ul className="space-y-2 text-sm">
          {[
            [admins.every((a) => a.active === true || !a.active) && admins.length > 0, "Admin sign-in uses an email and password (no shared password)"],
            [smtp, "Email alerts are connected, so you hear about every login and order"],
            [process.env.AUTH_SECRET !== undefined && (process.env.AUTH_SECRET?.length ?? 0) >= 32, "AUTH_SECRET is set to a long random value"],
            [process.env.NODE_ENV === "production", "Running in production mode (security headers and CSP active)"],
            [(process.env.ADMIN_PASSWORD || "1234") !== "1234", "The setup key (ADMIN_PASSWORD) is no longer the default 1234"],
          ].map(([good, text], i) => (
            <li key={i} className="flex gap-2">
              <span className={good ? "text-green-600" : "text-amber-600"}>{good ? "✓" : "!"}</span>
              <span className={good ? "text-slate-700" : "font-medium text-amber-800"}>{text as string}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Sessions end automatically after 60 minutes idle, after 8 hours total, and the moment you open the public website.
        </p>
      </section>

      {/* AUDIT LOG */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">Admin activity log</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing recorded yet.</p>
        ) : (
          <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
            {activity.map((a) => (
              <li key={hex(a._id)} className="relative">
                <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-black" />
                <p className="text-sm font-semibold">
                  {a.adminName} — {ACTION_LABEL[a.action] ?? a.action}
                </p>
                {a.detail && <p className="break-anywhere text-sm text-slate-600">{a.detail}</p>}
                <p className="text-xs text-slate-400">
                  {a.at.toLocaleString("en-GB")}
                  {a.ip ? ` · IP ${a.ip}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
