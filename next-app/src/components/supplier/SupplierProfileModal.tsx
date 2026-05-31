"use client";

import { BadgeCheck, Building2, Mail, MapPin, PencilLine, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SupplierProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    fullName?: string;
    email?: string;
    status?: string;
    company_name?: string;
    company_address?: string;
    phone?: string;
    business_type?: string;
    representative_name?: string;
    tin?: string;
    supplier_business_types?: any[];
  } | null;
}

export default function SupplierProfileModal({ isOpen, onClose, currentUser }: SupplierProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    company: currentUser?.company_name || "",
    representativeName: currentUser?.representative_name || "",
    tin: currentUser?.tin || "",
    phone: currentUser?.phone || "",
    address: currentUser?.company_address || "",
    businessType: currentUser?.business_type || "",
  });

  const [availableBusinessTypes, setAvailableBusinessTypes] = useState<{ id: string; name: string }[]>([]);
  const [selectedBusinessTypeIds, setSelectedBusinessTypeIds] = useState<string[]>([]);
  const [businessTypeNames, setBusinessTypeNames] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    setFormData({
      fullName: currentUser.fullName || "",
      email: currentUser.email || "",
      company: currentUser.company_name || "",
      representativeName: currentUser.representative_name || "",
      tin: currentUser.tin || "",
      phone: currentUser.phone || "",
      address: currentUser.company_address || "",
      businessType: currentUser.business_type || "",
    });

    (async () => {
      try {
        const res = await fetch("/api/public/business-types");
        const list = res.ok ? await res.json() : [];
        setAvailableBusinessTypes(list || []);

        // Get supplier's actual business types from the supplier data
        const sbt = (currentUser as any).supplier_business_types || [];
        if (sbt.length) {
          setSelectedBusinessTypeIds(sbt.map((s: any) => s.business_type_id || s.business_type?.id).filter(Boolean));
          setBusinessTypeNames(sbt.map((s: any) => s.business_type?.name).filter(Boolean));
        } else if (currentUser.business_type) {
          const match = (list || []).find((b: any) => b.name?.toLowerCase() === String(currentUser.business_type).toLowerCase());
          if (match) setSelectedBusinessTypeIds([match.id]);
          setBusinessTypeNames([currentUser.business_type]);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [currentUser]);

  if (!isOpen) return null;

  async function handleSave() {
    try {
      const payload: any = {
        full_name: formData.fullName,
        company_name: formData.company,
        company_address: formData.address,
        phone: formData.phone,
        representative_name: formData.representativeName,
        tin: formData.tin,
      };
      if (selectedBusinessTypeIds.length > 0) payload.business_type_ids = selectedBusinessTypeIds;
      const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to update profile");
      setIsEditing(false);
    } catch (e) {
      console.error("profile save failed", e);
    }
  }

  const displayName = currentUser?.fullName || "Supplier User";
  const companyName = formData.company || "—";
  const statusLabel = currentUser?.status === "pending" ? "Pending" : "Approved";
  const statusStyle = statusLabel === "Approved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-2 backdrop-blur-[2px] sm:p-4">
      <div className="flex w-full max-w-2xl max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Supplier Profile</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">Profile details</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 sm:h-16 sm:w-16 sm:text-xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{displayName}</p>
                <p className="mt-1 text-sm text-slate-500">{companyName}</p>
                <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusStyle}`}>
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {statusLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-5">
          {!isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email
                </div>
                <p className="break-words text-sm font-semibold text-slate-900">{formData.email}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone
                </div>
                <p className="break-words text-sm font-semibold text-slate-900">{formData.phone}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Address
                </div>
                <p className="break-words text-sm font-semibold text-slate-900">{formData.address}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Business Type
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {businessTypeNames.length > 0 ? businessTypeNames.map((name) => (
                    <span key={name} className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{name}</span>
                  )) : <span className="text-sm text-slate-500">No business type selected</span>}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <BadgeCheck className="h-4 w-4 text-slate-400" />
                  Representative
                </div>
                <p className="break-words text-sm font-semibold text-slate-900">{formData.representativeName}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <BadgeCheck className="h-4 w-4 text-slate-400" />
                  TIN
                </div>
                <p className="break-words text-sm font-semibold text-slate-900">{formData.tin}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {[
                { label: "Full Name", key: "fullName", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Company Name", key: "company", type: "text" },
                { label: "Representative Name", key: "representativeName", type: "text" },
                { label: "TIN", key: "tin", type: "text" },
                { label: "Phone Number", key: "phone", type: "tel" },
                { label: "Address", key: "address", type: "text" },
              ].map(({ label, key, type }) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
                  <input
                    type={type}
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Business Type</span>
                <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto">
                    {availableBusinessTypes.map((bt) => (
                      <label key={bt.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBusinessTypeIds.includes(bt.id)}
                          onChange={(e) => {
                            const next = new Set(selectedBusinessTypeIds);
                            if (e.target.checked) next.add(bt.id); else next.delete(bt.id);
                            setSelectedBusinessTypeIds(Array.from(next));
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                        <span className="text-sm text-slate-700">{bt.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </label>
            </div>
          )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">
          {isEditing ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setIsEditing(false)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:flex-1">Cancel</button>
              <button type="button" onClick={handleSave} className="w-full rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 sm:flex-1">Save Changes</button>
            </div>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:w-auto">
              <PencilLine className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
