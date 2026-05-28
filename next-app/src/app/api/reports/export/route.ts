import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import fs from "fs/promises";
import path from "path";

// Ensure this route runs under Node runtime (pdfkit requires Node APIs)
export const runtime = "nodejs";

function csvEscape(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const url = new URL(request.url);
  const type = String(url.searchParams.get("type") || "procurement");
  const format = String(url.searchParams.get("format") || "csv").toLowerCase();

  try {
    // PDF export (server-side) using pdf-lib to avoid native font/AFM issues
    if (format === "pdf") {
      const { PDFDocument: PDFLibDocument, StandardFonts, rgb } = await import("pdf-lib");

      const pdfDoc = await PDFLibDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // try to load an application logo from public/logo.png (optional); fallback to public/logo.svg
      let embeddedLogo: any = null;
      let svgLogoExists = false;
      try {
        const logoPath = path.join(process.cwd(), "public", "logo.png");
        const buf = await fs.readFile(logoPath);
        embeddedLogo = await pdfDoc.embedPng(buf);
      } catch (e) {
        try {
          const svgPath = path.join(process.cwd(), "public", "logo.svg");
          await fs.access(svgPath);
          svgLogoExists = true;
        } catch (e2) {
          svgLogoExists = false;
        }
      }

      const createProcurementPDF = async (title: string, summary: any, byType: any[], recentAwards: any[]) => {
        let page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        const margin = 48;
        let y = height - margin;

        // header: company info left, logo (if available) right
        page.drawText("E-Procurement", { x: margin, y: y - 12, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
        if (embeddedLogo) {
          try {
            const imgScale = 64 / embeddedLogo.width;
            const dims = embeddedLogo.scale(imgScale);
            page.drawImage(embeddedLogo, { x: width - margin - dims.width, y: y - dims.height - 8, width: dims.width, height: dims.height });
          } catch (e) {
            page.drawRectangle({ x: width - margin - 64, y: y - 40, width: 64, height: 32, borderColor: rgb(0.8, 0.8, 0.8) });
            page.drawText("LOGO", { x: width - margin - 40, y: y - 28, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
          }
        } else if (svgLogoExists) {
          const logoX = width - margin - 140;
          const logoY = y - 40;
          // draw a filled green box as a safe logo fallback (pdf-lib doesn't support drawEllipse reliably here)
          page.drawRectangle({ x: logoX, y: logoY, width: 32, height: 32, color: rgb(0.0627, 0.725, 0.507) });
          page.drawText("E", { x: logoX + 10, y: logoY + 6, size: 20, font, color: rgb(1, 1, 1) });
          page.drawText("E-Procurement", { x: logoX + 46, y: logoY + 12, size: 14, font, color: rgb(0.06, 0.09, 0.16) });
        } else {
          page.drawRectangle({ x: width - margin - 64, y: y - 40, width: 64, height: 32, borderColor: rgb(0.8, 0.8, 0.8) });
          page.drawText("LOGO", { x: width - margin - 40, y: y - 28, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
        }
        y -= 48;

        // Title
        page.drawText(title, { x: margin, y: y - 18, size: 18, font, color: rgb(0, 0, 0) });
        y -= 32;

        // Summary block
        page.drawText("Summary", { x: margin, y: y - 12, size: 12, font, color: rgb(0, 0, 0) });
        y -= 18;
        const summaryLines = [
          `Total Projects: ${summary.total_projects}`,
          `Active Projects: ${summary.active_projects}`,
          `Awarded Projects: ${summary.awarded_projects}`,
          `Total Bids: ${summary.total_bids}`,
          `Total Awarded Amount: ${summary.total_awarded_amount}`,
        ];
        for (const line of summaryLines) {
          page.drawText(line, { x: margin, y: y - 12, size: 10, font, color: rgb(0, 0, 0) });
          y -= 14;
        }
        y -= 8;

        // By procurement type table
        page.drawText("By Procurement Type", { x: margin, y: y - 12, size: 12, font, color: rgb(0, 0, 0) });
        y -= 18;
        // table header
        const col1 = margin;
        const col2 = margin + 300;
        page.drawText("Type", { x: col1, y: y - 12, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        page.drawText("Count", { x: col2, y: y - 12, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 16;
        for (const r of byType) {
          page.drawText(String(r.procurement_type), { x: col1, y: y - 12, size: 10, font, color: rgb(0, 0, 0) });
          page.drawText(String(r._count?.id ?? r.count ?? "0"), { x: col2, y: y - 12, size: 10, font, color: rgb(0, 0, 0) });
          y -= 14;
          if (y < margin + 100) { page = pdfDoc.addPage([595.28, 841.89]); y = height - margin; }
        }
        y -= 8;

        // Recent awards table
        page.drawText("Recent Awards", { x: margin, y: y - 12, size: 12, font, color: rgb(0, 0, 0) });
        y -= 18;
        const colA = margin;
        const colB = margin + 220;
        const colC = margin + 380;
        const colD = margin + 460;
        page.drawText("Project", { x: colA, y: y - 12, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        page.drawText("Winner", { x: colB, y: y - 12, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        page.drawText("Amount", { x: colC, y: y - 12, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        page.drawText("Date", { x: colD, y: y - 12, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 16;
        for (const a of recentAwards) {
          page.drawText(String(a.project__title || a.project?.title || "-"), { x: colA, y: y - 12, size: 10, font });
          page.drawText(String(a.winner__company_name || a.winner__full_name || "-"), { x: colB, y: y - 12, size: 10, font });
          page.drawText(String(a.bid_amount ?? ""), { x: colC, y: y - 12, size: 10, font });
          page.drawText(String(a.recorded_at ? new Date(a.recorded_at).toLocaleDateString() : ""), { x: colD, y: y - 12, size: 10, font });
          y -= 14;
          if (y < margin + 60) { page = pdfDoc.addPage([595.28, 841.89]); y = height - margin; }
        }

        // footer: timestamp and page numbers
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          const { width: pw } = p.getSize();
          const footerY = 28;
          p.drawText(new Date().toLocaleString(), { x: margin, y: footerY, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
          p.drawText(`Page ${i + 1} of ${pages.length}`, { x: pw - margin - 80, y: footerY, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
        }

        const bytes = await pdfDoc.save();
        return Buffer.from(bytes);
      };

      const createSuppliersPDF = async (title: string, suppliers: any[], bidCounts: Record<string, any>) => {
        let page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        const margin = 48;
        let y = height - margin;

        page.drawText("E-Procurement", { x: margin, y: y - 12, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
        if (embeddedLogo) {
          try {
            const imgScale = 64 / embeddedLogo.width;
            const dims = embeddedLogo.scale(imgScale);
            page.drawImage(embeddedLogo, { x: width - margin - dims.width, y: y - dims.height - 8, width: dims.width, height: dims.height });
          } catch (e) {
            page.drawRectangle({ x: width - margin - 64, y: y - 40, width: 64, height: 32, borderColor: rgb(0.8, 0.8, 0.8) });
            page.drawText("LOGO", { x: width - margin - 40, y: y - 28, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
          }
        } else if (svgLogoExists) {
          const logoX = width - margin - 140;
          const logoY = y - 40;
          // draw a filled green box as a safe logo fallback (pdf-lib doesn't support drawEllipse reliably here)
          page.drawRectangle({ x: logoX, y: logoY, width: 32, height: 32, color: rgb(0.0627, 0.725, 0.507) });
          page.drawText("E", { x: logoX + 10, y: logoY + 6, size: 20, font, color: rgb(1, 1, 1) });
          page.drawText("E-Procurement", { x: logoX + 46, y: logoY + 12, size: 14, font, color: rgb(0.06, 0.09, 0.16) });
        } else {
          page.drawRectangle({ x: width - margin - 64, y: y - 40, width: 64, height: 32, borderColor: rgb(0.8, 0.8, 0.8) });
          page.drawText("LOGO", { x: width - margin - 40, y: y - 28, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
        }
        y -= 48;
        page.drawText(title, { x: margin, y: y - 18, size: 18, font });
        y -= 28;

        // columns: name, company, email, type, bids/wins
        const colWidths = [110, 110, 200, 50, 30];
        const colsX: number[] = [];
        let cx = margin;
        for (const w of colWidths) { colsX.push(cx); cx += w; }

        const headerFontSize = 10; const bodyFontSize = 9; const lineHeight = bodyFontSize + 4;
        const headers = ["Name", "Company", "Email", "Type", "Bids/Wins"];
        for (let i = 0; i < headers.length; i++) page.drawText(headers[i], { x: colsX[i], y: y - 12, size: headerFontSize, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 18;

        const wrapText = (text: string, maxWidth: number, size: number) => {
          if (!text) return [""];
          const words = String(text).split(/\s+/);
          const lines: string[] = [];
          let cur = "";
          for (const w of words) {
            const tentative = cur ? `${cur} ${w}` : w;
            const widthText = font.widthOfTextAtSize(tentative, size);
            if (widthText <= maxWidth) cur = tentative; else { if (cur) lines.push(cur); cur = w; }
          }
          if (cur) lines.push(cur);
          return lines;
        };

        for (const s of suppliers) {
          const cells = [ String(s.full_name || "-"), String(s.company_name || "-"), String(s.email || "-"), String(s.business_type || "-"), `${(bidCounts[s.id]?.bid_count) || 0}/${(bidCounts[s.id]?.win_count) || 0}` ];
          const wrapped = cells.map((c, i) => wrapText(c, colWidths[i] - 6, bodyFontSize));
          const maxLines = Math.max(...wrapped.map(w => w.length));

          if (y - (maxLines * lineHeight) < margin + 40) { page = pdfDoc.addPage([595.28, 841.89]); y = height - margin; }

          for (let li = 0; li < maxLines; li++) {
            for (let ci = 0; ci < wrapped.length; ci++) {
              const text = wrapped[ci][li] || "";
              page.drawText(text, { x: colsX[ci], y: y - 12 - (li * lineHeight), size: bodyFontSize, font });
            }
          }
          y -= (maxLines * lineHeight) + 6;
        }

        const bytes = await pdfDoc.save();
        return Buffer.from(bytes);
      };

      if (type === "procurement") {
        const total_projects = await db.project.count();
        const active_projects = await db.project.count({ where: { status: "active" } });
        const awarded_projects = await db.project.count({ where: { status: "awarded" } });
        const total_bids = await db.bid.count();
        const totalAwardedResult = await db.blockchainRecord.aggregate({ _sum: { bid_amount: true } });
        const total_awarded_amount = Number(totalAwardedResult._sum.bid_amount || 0);

        const byTypeRows = await db.project.groupBy({ by: ["procurement_type"], _count: { id: true }, orderBy: { procurement_type: "asc" } });

        const recentAwards = await db.blockchainRecord.findMany({
          take: 100,
          orderBy: { recorded_at: "desc" },
          include: { project: { select: { title: true } }, winner: { select: { full_name: true, company_name: true } } },
        });

        const blocks: Array<{ heading?: string; rows: string[] }> = [];
        blocks.push({ heading: "Summary", rows: [
          `Total Projects: ${total_projects}`,
          `Active Projects: ${active_projects}`,
          `Awarded Projects: ${awarded_projects}`,
          `Total Bids: ${total_bids}`,
          `Total Awarded Amount: ${total_awarded_amount}`,
        ] });

        blocks.push({ heading: "By Procurement Type", rows: byTypeRows.map((row: any) => `${row.procurement_type}: ${row._count.id}`) });

        blocks.push({ heading: "Recent Awards", rows: recentAwards.map((row: any) => `${row.project?.title || "-"} — ${ (row.winner?.company_name || row.winner?.full_name) || "-" } — ${row.bid_amount ?? ""} — ${row.recorded_at?.toISOString().split("T")[0] || ""}`) });

        const pdfBuf = await createProcurementPDF("Procurement Report", { total_projects, active_projects, awarded_projects, total_bids, total_awarded_amount }, byTypeRows, recentAwards.map((row: any) => ({ ...row, project__title: row.project?.title })));
        return new Response(pdfBuf, { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="procurement-report.pdf"` } });
      }

      if (type === "suppliers") {
        const suppliers = await db.user.findMany({ where: { role: "supplier" }, select: { id: true, full_name: true, email: true, company_name: true, business_type: true, status: true, created_at: true }, orderBy: { created_at: "desc" } });
        const bids = await db.bid.findMany({ select: { supplier_id: true, status: true } });
        const bidCounts: Record<string, { bid_count: number; win_count: number }> = {};
        for (const b of bids) {
          const sid = String(b.supplier_id || "");
          if (!sid) continue;
          if (!bidCounts[sid]) bidCounts[sid] = { bid_count: 0, win_count: 0 };
          bidCounts[sid].bid_count += 1;
          if (b.status === "won") bidCounts[sid].win_count += 1;
        }

        const pdfBuf = await createSuppliersPDF("Suppliers Report", suppliers, bidCounts);
        return new Response(pdfBuf, { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="suppliers-report.pdf"` } });
      }
    }
    if (type === "procurement" && format === "csv") {
      // gather procurement report data (reuse logic similar to procurement route)
      const total_projects = await db.project.count();
      const active_projects = await db.project.count({ where: { status: "active" } });
      const awarded_projects = await db.project.count({ where: { status: "awarded" } });
      const total_bids = await db.bid.count();
      const totalAwardedResult = await db.blockchainRecord.aggregate({ _sum: { bid_amount: true } });
      const total_awarded_amount = Number(totalAwardedResult._sum.bid_amount || 0);

      const byTypeRows = await db.project.groupBy({ by: ["procurement_type"], _count: { id: true }, orderBy: { procurement_type: "asc" } });

      const recentAwards = await db.blockchainRecord.findMany({
        take: 100,
        orderBy: { recorded_at: "desc" },
        include: { project: { select: { title: true } }, winner: { select: { full_name: true, company_name: true } } },
      });

      const lines: string[] = [];
      lines.push(["E-Procurement Report", new Date().toISOString()].join(","));
      lines.push(["Report", "Procurement Summary"].join(","));
      lines.push(["Total Projects", total_projects].join(","));
      lines.push(["Active Projects", active_projects].join(","));
      lines.push(["Awarded Projects", awarded_projects].join(","));
      lines.push(["Total Bids", total_bids].join(","));
      lines.push(["Total Awarded Amount", total_awarded_amount].join(","));
      lines.push("");

      lines.push("By Procurement Type");
      lines.push(["Type", "Count"].join(","));
      for (const r of byTypeRows) lines.push([csvEscape(r.procurement_type), csvEscape(r._count.id)].join(","));
      lines.push("");

      lines.push("Recent Awards");
      lines.push(["Project", "Winner", "Amount", "Recorded At"].join(","));
      for (const r of recentAwards) {
        const winner = r.winner?.company_name || r.winner?.full_name || "";
        lines.push([csvEscape(r.project?.title), csvEscape(winner), csvEscape(Number(r.bid_amount)), csvEscape(r.recorded_at?.toISOString() || "")].join(","));
      }

      const csv = lines.join("\n");
      const csvContent = "\uFEFF" + csv; // UTF-8 BOM for Excel
      const filename = `procurement-report-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      return new Response(csvContent, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` } });
    }

    if (type === "suppliers" && format === "csv") {
      // suppliers
      const suppliers = await db.user.findMany({ where: { role: "supplier" }, select: { id: true, full_name: true, email: true, company_name: true, business_type: true, status: true, created_at: true, _count: { select: { bids: true, blockchain_records: true } } }, orderBy: { created_at: "desc" } });
      const bids = await db.bid.findMany({ select: { supplier_id: true, status: true } });
      const bidCounts: Record<string, { bid_count: number; win_count: number }> = {};
      for (const b of bids) {
        const sid = String(b.supplier_id || "");
        if (!sid) continue;
        if (!bidCounts[sid]) bidCounts[sid] = { bid_count: 0, win_count: 0 };
        bidCounts[sid].bid_count += 1;
        if (b.status === "won") bidCounts[sid].win_count += 1;
      }

      const lines: string[] = [];
      lines.push(["E-Procurement Suppliers Report", new Date().toISOString()].join(","));
      lines.push(["Name", "Company", "Email", "Type", "Status", "Bids", "Wins", "Registered At"].join(","));
      for (const s of suppliers) {
        const counts = bidCounts[s.id] || { bid_count: 0, win_count: 0 };
        lines.push([csvEscape(s.full_name), csvEscape(s.company_name), csvEscape(s.email), csvEscape(s.business_type), csvEscape(s.status), csvEscape(counts.bid_count), csvEscape(counts.win_count), csvEscape(s.created_at?.toISOString() || "")].join(","));
      }
      const csv = lines.join("\n");
      const csvContent = "\uFEFF" + csv;
      const filename = `suppliers-report-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      return new Response(csvContent, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` } });
    }

    return json({ error: "Invalid type/format" }, 400);
  } catch (error) {
    console.error("[api/reports/export]", error);
    return json({ error: error instanceof Error ? error.message : "Failed to export report." }, 500);
  }
}
