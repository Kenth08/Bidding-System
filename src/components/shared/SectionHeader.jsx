// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\SectionHeader.jsx
export default function SectionHeader({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
