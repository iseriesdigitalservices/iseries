import { getPaymentMethods, KIND_LABEL } from "@/backend/admin";
import { isAdmin } from "@/backend/admin";
import { hex } from "@/backend/mongo";
import AdminForm from "@/frontend/components/AdminForm";

export const dynamic = "force-dynamic";

const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-black";
type M = Awaited<ReturnType<typeof getPaymentMethods>>[number];

function MethodForm({ m }: { m?: M }) {
  return (
    <AdminForm action="payment_save" hidden={m ? { id: hex(m._id) } : undefined} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
        <select name="kind" defaultValue={m?.kind ?? "bank"} className={inp}>
          <option value="easypaisa">EasyPaisa</option>
          <option value="jazzcash">JazzCash</option>
          <option value="bank">Bank Transfer</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Account title *</label>
        <input name="accountTitle" required defaultValue={m?.accountTitle} className={inp} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Account / mobile / IBAN *</label>
        <input name="accountNumber" required defaultValue={m?.accountNumber} className={inp} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Bank name (bank only)</label>
        <input name="bankName" defaultValue={m?.bankName ?? ""} className={inp} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-500">Extra IBAN (optional)</label>
        <input name="iban" defaultValue={m?.iban ?? ""} className={inp} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={m ? m.active : true} /> Show to customers
      </label>
      <div className="flex justify-end">
        <button className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-[#f5c518]">{m ? "Save" : "Add account"}</button>
      </div>
    </AdminForm>
  );
}

export default async function PaymentsAdmin() {
  if (!(await isAdmin())) return null; // never run queries or render data for visitors
  const methods = await getPaymentMethods();
  return (
    <div>
      <h1 className="text-2xl font-black">Payment Accounts</h1>
      <p className="mt-1 text-sm text-slate-600">Only accounts marked &quot;Show to customers&quot; appear at checkout.</p>
      <div className="mt-5 space-y-5">
        {methods.map((m) => (
          <div key={hex(m._id)} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">
                {KIND_LABEL[m.kind]} {!m.active && <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs">hidden</span>}
              </h2>
              <AdminForm action="payment_delete" hidden={{ id: hex(m._id) }} confirm="Delete this account?" inline>
                <button className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
              </AdminForm>
            </div>
            <MethodForm m={m} />
          </div>
        ))}
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-5">
          <h2 className="mb-3 font-bold text-slate-700">+ Add new account</h2>
          <MethodForm />
        </div>
      </div>
    </div>
  );
}
