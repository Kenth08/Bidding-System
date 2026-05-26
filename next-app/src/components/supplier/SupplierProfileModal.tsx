"use client";

import { BadgeCheck, Building2, Mail, MapPin, PencilLine, Phone, X } from "lucide-react";
import { useState } from "react";

const BUSINESS_TYPES = ["Construction", "IT Services", "Healthcare", "Logistics", "Consulting", "Other"];

interface SupplierProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { fullName?: string; email?: string; status?: string } | null;
}

export default function SupplierProfileModal({ isOpen, onClose, currentUser }: SupplierProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || "Supplier User",
    email: currentUser?.email || "supplier@eprocurement.gov",
    company: "Apex InfraTech",
    phone: "+63 917 555 1234",
    address: "123 Business District, Metro City",
    businessType: "IT Services",
  });

  if (!isOpen) return null;

  function handleSave() {
    setIsEditing(false);
  }

  const displayName = currentUser?.fullName || "Supplier User";
  const companyName = formData.company;
  const statusLabel = currentUser?.status === "pending" ? "Pending" : "Approved";
  const statusStyle = statusLabel === "Approved"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Supplier Profile</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Profile details</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">{displayName}</p>
                <p className="mt-1 text-sm text-slate-500">{companyName}</p>
                <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusStyle}`}>
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {statusLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
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
                <p className="break-words text-sm font-semibold text-slate-900">{formData.businessType}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {[
                { label: "Full Name", key: "fullName", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Company Name", key: "company", type: "text" },
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
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                >
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          {isEditing ? (
            <>
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleSave} className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600">Save Changes</button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="inline-flex w-auto items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
              <PencilLine className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
