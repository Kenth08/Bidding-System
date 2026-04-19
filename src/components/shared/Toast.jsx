// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\Toast.jsx
export default function Toast({ message, isVisible }) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80] rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}
