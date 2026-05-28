"use client";

import Link from "next/link";
import { AlertCircle, Upload, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { suppliersAPI } from "@/services/api";
import Toast from "@/components/shared/Toast";

export default function RevisionRequiredPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setMessage("Your supplier account is currently under admin review. Please re-upload the flagged documents to continue.");
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-4">
        <AlertCircle className="h-8 w-8 text-amber-700" />
        <div>
          <h2 className="text-lg font-semibold text-amber-900">Limited Access: Revision Required</h2>
          <p className="mt-1 text-sm text-amber-800">{message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/supplier/documents/reupload" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"> <Upload className="h-4 w-4" /> Re-upload Documents</Link>
            <Link href="/supplier/profile" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"> <FileText className="h-4 w-4" /> Edit Profile</Link>
            <Link href="/supplier/notifications" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Notifications</Link>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm text-slate-600">While your account is in revision mode you will not be able to access bidding, procurement, auctions, or project participation until admin approves your documents.</p>
      </div>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
