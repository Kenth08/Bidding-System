"use client";

import Link from "next/link";
import { AlertCircle, Upload, FileText, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { suppliersAPI } from "@/services/api";

interface DocItem {
  id: string;
  name: string;
  state: string;
  reason?: string | null;
}

export default function RevisionRequiredPage() {
  const [flagged, setFlagged] = useState<DocItem[]>([]);
  const [approved, setApproved] = useState<DocItem[]>([]);

  useEffect(() => {
    suppliersAPI.getMyDocumentWorkflow().then((res) => {
      const docs: DocItem[] = Array.isArray(res.data?.documents) ? res.data.documents : [];
      setFlagged(docs.filter((d) => d.state === "flagged"));
      setApproved(docs.filter((d) => d.state === "approved"));
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-4">
        <AlertCircle className="h-8 w-8 text-amber-700 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold text-amber-900">Limited Access: Revision Required</h2>
          <p className="mt-1 text-sm text-amber-800">Some of your submitted documents have been flagged for revision. Please re-upload the corrected documents to regain full access to bidding.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/supplier/documents/reupload" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"><Upload className="h-4 w-4" /> Re-upload Documents</Link>
            <Link href="/supplier/profile" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"><FileText className="h-4 w-4" /> Edit Profile</Link>
            <Link href="/supplier/notifications" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Notifications</Link>
          </div>
        </div>
      </div>

      {flagged.length > 0 && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-red-900">Documents needing revision</h3>
          {flagged.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-red-200 bg-white px-3 py-2">
              <p className="text-sm font-medium text-slate-900">{doc.name}</p>
              {doc.reason && <p className="text-xs text-red-700 mt-0.5">Reason: {doc.reason}</p>}
            </div>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-emerald-900">Approved documents</h3>
          {approved.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{doc.name}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-slate-600">You must complete supplier verification before participating in bidding. While your account is in revision mode you will not be able to access bidding, procurement, auctions, or project participation until admin approves your documents.</p>
    </div>
  );
}
