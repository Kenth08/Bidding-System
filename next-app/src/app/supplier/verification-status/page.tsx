'use client';

import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle2, Clock, Flag, FileText } from 'lucide-react';
import Link from 'next/link';

export default function VerificationStatusPage() {
  const { user } = useAuth(); // Assume this hook provides real-time user data

  const statusConfig = {
    pending: {
      icon: <Clock className="text-yellow-500 w-12 h-12" />,
      title: "Verification Pending",
      description: "Our administrators are currently reviewing your documents. This usually takes 1-3 business days.",
      banner: "bg-yellow-50 border-yellow-200 text-yellow-800",
    },
    flagged: {
      icon: <Flag className="text-red-500 w-12 h-12" />,
      title: "Documents Flagged",
      description: "Some of your documents require attention. Please review the comments below and re-upload the corrected files.",
      banner: "bg-red-50 border-red-200 text-red-800",
    },
    verified: {
      icon: <CheckCircle2 className="text-green-500 w-12 h-12" />,
      title: "Account Verified",
      description: "Congratulations! Your account is fully verified. You now have full access to all bidding features.",
      banner: "bg-green-50 border-green-200 text-green-800",
    }
  };

  const current = statusConfig[user?.verification_status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Warning Banner */}
      {user?.verification_status !== 'verified' && (
        <div className={`mb-8 p-4 border rounded-lg flex items-center gap-3 ${current.banner}`}>
          <AlertCircle className="shrink-0" />
          <p className="font-medium">
            {user?.verification_status === 'flagged'
              ? "You must complete supplier verification before participating in bidding."
              : "Your supplier account is currently under admin review."}
          </p>
        </div>
      )}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 text-center border-b">
          <div className="flex justify-center mb-4">{current.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{current.title}</h1>
          <p className="text-gray-600 max-w-md mx-auto">{current.description}</p>
        </div>

        <div className="p-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Document Verification Progress
          </h2>
          
          <div className="space-y-4">
            {/* Example Document Row - This would be mapped from user data */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">Mayor&apos;s Permit</p>
                {user?.verification_notes && (
                  <p className="text-sm text-red-600 mt-1 italic">&quot;{user.verification_notes}&quot;</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  user?.verification_status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {user?.verification_status === 'flagged' ? 'Action Required' : 'Reviewing'}
                </span>
                {user?.verification_status === 'flagged' && (
                  <Link 
                    href="/supplier/documents/reupload"
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                  >
                    Re-upload
                  </Link>
                )}
              </div>
            </div>
          </div>

          {user?.verification_status === 'verified' && (
            <div className="mt-8">
              <Link 
                href="/supplier/projects"
                className="w-full block text-center py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg"
              >
                Start Bidding Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}