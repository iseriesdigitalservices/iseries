import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Gift, Wallet } from "lucide-react";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import ProfileForm from "@/frontend/components/ProfileForm";
import LogoutButton from "@/frontend/components/LogoutButton";
import CopyLink from "@/frontend/components/CopyLink";
import Pager, { paginate } from "@/frontend/components/Pager";
import { getCurrentUser } from "@/backend/auth";
import { baseUrl } from "@/backend/mail";
import { cols, hex } from "@/backend/mongo";
import { referralOverview } from "@/backend/referral";
import { ORDER_STATUS, REFERRAL_RATE, formatPKR } from "@/shared/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account — I Series Digital Services" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ord?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const sp = await searchParams;
  const id = hex(user._id);
  const { orders } = await cols();
  const [myOrders, ref, origin] = await Promise.all([
    orders.find({ userId: id }).sort({ createdAt: -1 }).toArray(),
    referralOverview(id),
    baseUrl(),
  ]);
  const ordPage = paginate(myOrders, sp.ord);
  const link = `${origin}/register?ref=${user.referralCode}`;
  const pct = REFERRAL_RATE * 100;

  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <Header />

      <section className="bg-[#0a0a0a] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5c518] text-2xl font-black text-black">
              {user.name.trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">My profile</p>
              <h1 className="text-2xl font-black">{user.name}</h1>
              <p className="text-sm text-slate-300">{user.email} · {user.phone}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {/* REFERRAL */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-black to-neutral-800 p-6 text-white shadow-xl sm:p-8">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#f5c518]">
            <Gift className="h-4 w-4" /> Refer &amp; Earn {pct}%
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Bring new customers and earn {pct}% on every order</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Give your link to someone new. When they sign up with it, place an order and the payment is approved, {pct}% of that order goes to your account.
            The admin then deposits it to you. The more new people you bring, the more profit you make.
          </p>
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">
              Your referral code: <b className="text-base tracking-[.25em] text-[#f5c518]">{user.referralCode}</b>
            </p>
            <CopyLink link={link} code={user.referralCode} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Available balance", formatPKR(ref.balance), "bg-[#f5c518] text-black"],
              ["Total earned", formatPKR(ref.earned), "bg-white/10"],
              ["Paid to you", formatPKR(ref.paid), "bg-white/10"],
              ["Pending approval", formatPKR(ref.pending), "bg-white/10"],
            ].map(([l, v, c]) => (
              <div key={l} className={`rounded-2xl p-4 ${c}`}>
                <p className="text-[11px] font-semibold uppercase opacity-70">{l}</p>
                <p className="text-xl font-black sm:text-2xl">{v}</p>
              </div>
            ))}
          </div>
          {!user.payoutAccount && (
            <p className="mt-4 rounded-xl bg-amber-400/20 p-3 text-sm text-amber-200">
              ⚠ No payout account yet. Add your JazzCash / EasyPaisa / bank details in the &quot;Profile&quot; section below so the admin can deposit your earnings.
            </p>
          )}
        </section>

        {/* REFERRED PEOPLE */}
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 className="text-lg font-black">People you referred ({ref.referred.length})</h2>
          {ref.referred.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nobody yet. Share your link!</p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100 text-sm">
              {ref.referred.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-slate-500">Joined {r.joined.toLocaleDateString("en-GB")} · {r.orders} order{r.orders === 1 ? "" : "s"}</p>
                  </div>
                  <p className="font-black text-green-700">+ {formatPKR(r.earned)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COMMISSIONS + PAYOUTS */}
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
            <h2 className="text-lg font-black">Commission history</h2>
            {ref.commissions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No commission yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 text-sm">
                {ref.commissions.map((c) => (
                  <div key={hex(c._id)} className="flex justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-semibold">{c.referredName}</p>
                      <p className="text-xs text-slate-500">{c.orderNo} · {formatPKR(c.orderTotal)} · {c.createdAt.toLocaleDateString("en-GB")}</p>
                    </div>
                    <p className={`font-black ${c.status === "cancelled" ? "text-slate-400 line-through" : "text-green-700"}`}>+ {formatPKR(c.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-black"><Wallet className="h-5 w-5" /> Payouts received</h2>
            {ref.payouts.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No payouts yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 text-sm">
                {ref.payouts.map((p) => (
                  <div key={hex(p._id)} className="flex justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-semibold">{p.createdAt.toLocaleDateString("en-GB")}</p>
                      {p.note && <p className="text-xs text-slate-500">{p.note}</p>}
                    </div>
                    <p className="font-black">{formatPKR(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ORDERS */}
        <section id="orders" className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">My orders ({myOrders.length})</h2>
            <Link href="/services" className="text-sm font-semibold underline">New order</Link>
          </div>
          {myOrders.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">You have not placed any order yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {ordPage.items.map((o) => {
                const st = ORDER_STATUS[o.status];
                return (
                  <Link key={hex(o._id)} href={`/account/orders/${o.orderNo}`} className="block rounded-2xl border border-slate-200 p-4 transition hover:border-black hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-black tracking-wider">{o.orderNo}</p>
                        <p className="text-xs text-slate-500">{o.createdAt.toLocaleString("en-GB")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black">{formatPKR(o.total)}</p>
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${st?.cls}`}>{st?.short}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{o.items.map((i) => i.title).join(" • ")}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs font-semibold">View full details <ArrowRight className="h-3 w-3" /></p>
                  </Link>
                );
              })}
            </div>
          )}
          <Pager basePath="/account" param="ord" page={ordPage.page} pages={ordPage.pages} total={ordPage.total} label="orders" hash="orders" />
        </section>

        {/* PROFILE */}
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 className="mb-4 text-lg font-black">Profile</h2>
          <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone, country: user.country, payoutAccount: user.payoutAccount }} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
