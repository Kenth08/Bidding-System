import { Edit2, FileCheck, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { documentAPI } from "../../services/api";

const DOCUMENT_TYPES = [
  { type: "Legal Documents", status: "Verified", uploadedDate: "2026-04-15" },
  { type: "Business Permit", status: "Verified", uploadedDate: "2026-04-15" },
  { type: "PhilGEPS Registration", status: "Pending", uploadedDate: "2026-04-16" },
];

export default function SupplierProfile({ currentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [documents, setDocuments] = useState(DOCUMENT_TYPES);
  const [profile, setProfile] = useState({
    fullName: currentUser?.fullName || "Sample Supplier",
    companyName: currentUser?.companyName || "ABC Logistics Inc.",
    email: currentUser?.email || "contact@abclogistics.com",
    phone: currentUser?.phone || "+63-2-8123-4567",
    address: currentUser?.companyAddress || "123 Business Street, Metro Manila, Philippines",
    businessType: currentUser?.businessType || "Logistics",
  });

  const [editForm, setEditForm] = useState(profile);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const uploadRefs = {
    "Legal Documents": useRef(null),
    "Business Permit": useRef(null),
    "PhilGEPS Registration": useRef(null),
  };

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await documentAPI.getAll();
        const items = res.data.results || res.data || [];
        if (items.length) {
          setDocuments(
            items.map((item) => ({
              type: item.document_type,
              status: item.verification_status,
              uploadedDate: item.created_at,
              fileName: item.file_name,
              fileUrl: item.file_url,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load supplier documents", error);
      }
    }

    loadDocuments();
  }, []);

  const handleSaveProfile = () => {
    setProfile(editForm);
    setIsEditing(false);
    setToast({ message: "Profile updated successfully", type: "success" });
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
        {
          type: saved.document_type,
          status: saved.verification_status,
          uploadedDate: saved.created_at,
          fileName: saved.file_name,
          fileUrl: saved.file_url,
        },
        ...prev.filter((item) => item.type !== docType),
      ]);
      setToast({ message: `${docType} uploaded successfully. Pending verification.`, type: "success" });
    } catch (error) {
      console.error("Failed to upload document", error);
      setToast({ message: `${docType} upload failed.`, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage your supplier profile information</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
        >
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-8">
            {/* Company Logo/Avatar */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
                {profile.companyName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{profile.companyName}</h2>
                <p className="text-sm text-slate-500">{profile.businessType}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full Name</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{profile.fullName}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{profile.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Company Address</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{profile.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Account Status</p>
            <div className="mb-6">
              <StatusBadge status="Approved" />
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-700">Registration Date</p>
                <p className="text-slate-600">April 15, 2026</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Joined</p>
                <p className="text-slate-600">22 days ago</p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="font-semibold text-slate-700 mb-2">Account Verified</p>
                <p className="text-emerald-600 flex items-center gap-2 text-xs">
                  <FileCheck className="h-4 w-4" />
                  All documents verified
                </p>
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
          {documents.map((doc, index) => (
            <div key={index} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{doc.type}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Uploaded on {new Date(doc.uploadedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => uploadRefs[doc.type]?.current?.click()}
                    disabled={uploading}
                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Re-upload document"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <input
                    ref={uploadRefs[doc.type]}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(event) => handleFileUpload(doc.type, event.target.files?.[0])}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">Upload Additional Documents</span>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</span>
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</span>
            <input
              type="text"
              value={editForm.companyName}
              onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
            </label>
          </div>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Address</span>
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
