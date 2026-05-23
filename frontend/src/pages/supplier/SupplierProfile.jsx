import { Edit2, FileCheck, Upload, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import LoadingButton from "../../components/ui/LoadingButton";
import { authAPI, documentAPI } from "../../services/api";

export default function SupplierProfile({ currentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef(null);

  const profile = {
    fullName: currentUser?.full_name || "",
    companyName: currentUser?.company_name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    address: currentUser?.company_address || "",
    businessType: currentUser?.business_type || "",
  };

  const [editForm, setEditForm] = useState(profile);

  useEffect(() => {
    setEditForm({
      fullName: currentUser?.full_name || "",
      companyName: currentUser?.company_name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
      address: currentUser?.company_address || "",
      businessType: currentUser?.business_type || "",
    });
  }, [currentUser]);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await documentAPI.getAll();
        const items = res.data.results || res.data || [];
        if (items.length) {
          setDocuments(items.map((item) => ({
            type: item.document_type,
            status: item.verification_status,
            uploadedDate: item.created_at,
            fileName: item.file_name,
            fileUrl: item.file_url,
          })));
        }
      } catch (error) {
        console.error("Failed to load supplier documents", error);
      }
    }
    loadDocuments();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await authAPI.updateProfile({
        full_name: editForm.fullName,
        company_name: editForm.companyName,
        phone: editForm.phone,
        company_address: editForm.address,
        business_type: editForm.businessType,
      });
      setIsEditing(false);
      setToast({ message: "Profile updated successfully", type: "success" });
    } catch (error) {
      setToast({ message: error.response?.data?.error || "Failed to update profile", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (docType, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const payload = new FormData();
      payload.append("document_type", docType);
      payload.append("file_name", file.name);
      payload.append("file", file);
      payload.append("file_size", String(file.size));
      const res = await documentAPI.upload(payload);
      const saved = res.data;
      setDocuments((prev) => [
        { type: saved.document_type, status: saved.verification_status, uploadedDate: saved.created_at, fileName: saved.file_name, fileUrl: saved.file_url },
        ...prev.filter((item) => item.type !== docType),
      ]);
      setToast({ message: `${docType} uploaded successfully.`, type: "success" });
    } catch (error) {
      setToast({ message: `${docType} upload failed.`, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  // Dynamic status card data
  const accountStatus = currentUser?.status || "pending";
  const createdAt = currentUser?.created_at ? new Date(currentUser.created_at) : null;
  const registrationDate = createdAt ? createdAt.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const daysAgo = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000)) : null;
  const allDocsVerified = documents.length > 0 && documents.every((d) => d.status === "Verified");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage your supplier profile information</p>
        </div>
        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50">
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
                {(profile.companyName || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{profile.companyName || "No company name"}</h2>
                <p className="text-sm text-slate-500">{profile.businessType || "No business type"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full Name</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{profile.fullName || "—"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{profile.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{profile.phone || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Company Address</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{profile.address || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Status Card */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Account Status</p>
            <div className="mb-6">
              <StatusBadge status={accountStatus} />
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-700">Registration Date</p>
                <p className="text-slate-600">{registrationDate}</p>
              </div>
              {daysAgo !== null && (
                <div>
                  <p className="font-semibold text-slate-700">Joined</p>
                  <p className="text-slate-600">{daysAgo === 0 ? "Today" : `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`}</p>
                </div>
              )}
              <div className="pt-4 border-t border-slate-200">
                <p className="font-semibold text-slate-700 mb-2">Document Status</p>
                {allDocsVerified ? (
                  <p className="text-emerald-600 flex items-center gap-2 text-xs"><FileCheck className="h-4 w-4" />All documents verified</p>
                ) : (
                  <p className="text-amber-600 flex items-center gap-2 text-xs"><AlertCircle className="h-4 w-4" />Some documents pending verification</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Uploaded Documents</h3>
          <p className="text-sm text-slate-500 mt-0.5">Manage and view your company documents</p>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">No documents uploaded yet.</div>
          ) : documents.map((doc, index) => (
            <div key={index} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{doc.type}</p>
                  <p className="text-xs text-slate-500 mt-1">Uploaded on {new Date(doc.uploadedDate).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={doc.status} />
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={() => uploadRef.current?.click()} disabled={uploading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload Additional Documents"}</span>
          </button>
          <input ref={uploadRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileUpload("Supporting Documents", e.target.files?.[0])} />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</span>
            <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</span>
            <input type="text" value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
              <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Business Type</span>
              <input type="text" value={editForm.businessType} onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
            </label>
          </div>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Address</span>
            <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
          </label>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <LoadingButton type="submit" isLoading={isSaving} loadingText="Saving..." className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Save Changes</LoadingButton>
          </div>
        </form>
      </Modal>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
