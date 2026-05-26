"use client";
import { useState, useEffect } from "react";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { User } from "@/types/user";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Toast from "@/components/shared/Toast";
import LoadingButton from "@/components/ui/LoadingButton";

const FIELDS = [
  { key: "full_name", label: "Full Name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "representative_name", label: "Representative Name", type: "text" },
  { key: "tin", label: "TIN", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "company_name", label: "Company Name", type: "text" },
  { key: "company_address", label: "Company Address", type: "text" },
  { key: "business_type", label: "Business Type", type: "text" },
] as const;

type FormData = Pick<User, "full_name" | "email" | "representative_name" | "tin" | "phone" | "company_name" | "company_address" | "business_type" | "company_profile">;

export default function SupplierProfile() {
  const { setUser } = useAuthStore();
  const [form, setForm] = useState<FormData>({ full_name: "", email: "", representative_name: "", tin: "", phone: "", company_name: "", company_address: "", business_type: "", company_profile: "" });
  const [loading, setLoading] = useState(true);
  const [confirmSave, setConfirmSave] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    authAPI.me().then((r) => {
      const u = r.data;
      setForm({ full_name: u.full_name, email: u.email, representative_name: u.representative_name || "", tin: u.tin || "", phone: u.phone || "", company_name: u.company_name || "", company_address: u.company_address || "", business_type: u.business_type || "", company_profile: u.company_profile || "" });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleConfirmSave() {
    setIsConfirmLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      setUser(res.data);
      setToast({ message: "Profile updated successfully.", type: "success" });
    } catch { setToast({ message: "Failed to update profile.", type: "error" }); }
    finally { setIsConfirmLoading(false); setConfirmSave(false); }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-12 rounded-xl bg-slate-100" /><div className="h-12 rounded-xl bg-slate-100" /></div>;

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <form onSubmit={(e) => { e.preventDefault(); setConfirmSave(true); }} className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-slate-700">{f.label}</label>
            <input type={f.type} value={String(form[f.key] ?? "")} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Company Profile</label>
          <textarea value={String(form.company_profile ?? "")} onChange={(e) => setForm((prev) => ({ ...prev, company_profile: e.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
        </div>
        <LoadingButton type="submit" isLoading={false} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Save Changes</LoadingButton>
      </form>
      <ConfirmDialog isOpen={confirmSave} onClose={() => setConfirmSave(false)} onConfirm={handleConfirmSave} title="Save Profile Changes" message="Are you sure you want to update your profile information?" confirmLabel="Save Changes" isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
