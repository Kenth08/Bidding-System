"use client";
import { useState, useEffect } from "react";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { User } from "@/types/user";

const FIELDS = [
  { key: "full_name", label: "Full Name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "company_name", label: "Company Name", type: "text" },
  { key: "company_address", label: "Company Address", type: "text" },
  { key: "business_type", label: "Business Type", type: "text" },
] as const;

type FormData = Pick<User, "full_name" | "email" | "phone" | "company_name" | "company_address" | "business_type">;

export default function SupplierProfile() {
  const { setUser } = useAuthStore();
  const [form, setForm] = useState<FormData>({ full_name: "", email: "", phone: "", company_name: "", company_address: "", business_type: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    authAPI.me().then((r) => {
      const u = r.data;
      setForm({ full_name: u.full_name, email: u.email, phone: u.phone || "", company_name: u.company_name || "", company_address: u.company_address || "", business_type: u.business_type || "" });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await authAPI.updateProfile(form);
      setUser(res.data);
      setMessage("Profile updated successfully.");
    } catch {
      setMessage("Failed to update profile.");
    }
    setSaving(false);
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-12 rounded-xl bg-slate-100" /><div className="h-12 rounded-xl bg-slate-100" /></div>;

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <form onSubmit={handleSave} className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-slate-700">{f.label}</label>
            <input type={f.type} value={form[f.key]} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </div>
        ))}
        {message && <p className={`text-xs ${message.includes("success") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
