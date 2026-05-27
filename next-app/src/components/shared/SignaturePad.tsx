"use client";
import React, { useRef, useEffect, useState } from "react";

export default function SignaturePad({ onSave, onClear }: { onSave: (blob: Blob, dataUrl: string) => void; onClear?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.5;
    context.strokeStyle = "#111827";
    setCtx(context);
    context.clearRect(0, 0, rect.width, rect.height);
  }, []);

  function getPointerPos(e: MouseEvent | TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if (e instanceof TouchEvent) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    const me = e as MouseEvent;
    return { x: me.clientX - rect.left, y: me.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setIsDrawing(true);
    const native = (e as any).nativeEvent as MouseEvent | TouchEvent;
    const p = getPointerPos(native);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  }

  function moveDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const native = (e as any).nativeEvent as MouseEvent | TouchEvent;
    const p = getPointerPos(native);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    setIsDrawing(false);
    ctx?.closePath();
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    onClear?.();
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    onSave(blob, dataUrl);
  }

  return (
    <div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
          style={{ width: "100%", height: 160, touchAction: "none", background: "white" }}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={clear} className="rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-700">Clear</button>
        <button type="button" onClick={save} className="rounded-md bg-emerald-500 px-3 py-1 text-xs text-white">Save Signature</button>
      </div>
    </div>
  );
}
