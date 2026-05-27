import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";
import { logAudit, notifyAdmins } from "@/lib/actions";
import { publishEvent } from "@/lib/sse";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_BID_DOCUMENT_EXTENSIONS = new Set([".pdf", ".docx"]);

function recalculateRanks(bids: { id: string; bid_amount: unknown; submitted_at: Date }[]) {
  const sorted = [...bids].sort((a, b) => Number(a.bid_amount) - Number(b.bid_amount) || a.submitted_at.getTime() - b.submitted_at.getTime());
  return sorted.map((b, i) => ({ id: b.id, rank: i + 1 }));
}

async function saveFile(file: File, folder: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || ".bin";
  const filename = `${uuid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

function isAllowedBidDocument(file: File) {
  return ALLOWED_BID_DOCUMENT_EXTENSIONS.has(path.extname(file.name).toLowerCase());
}

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "1" || value === "on";
}

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("project");

  if (user!.role === "admin") {
    const where: Record<string, unknown> = {};
    if (projectId) where.project_id = projectId;
    const bids = await db.bid.findMany({
      where,
      include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true, verification_status: true } } },
      orderBy: [{ bid_amount: "asc" }, { submitted_at: "asc" }],
    });
    return json(bids);
  }

  if (user!.role === "supplier") {
    const bids = await db.bid.findMany({
      where: { supplier_id: user!.id },
      include: { project: true },
      orderBy: { submitted_at: "desc" },
    });
    return json(bids);
  }

  return json([]);
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  if (user!.role !== "supplier") {
    return json({ error: "Only suppliers can submit bids." }, 403);
  }

  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, any> = {};
  let quotationDocument: string | null = null;
  let technicalProposalDocument: string | null = null;
  let supportingDocuments: string | null = null;
  let digitalSignaturePath: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, any>;
    const file = formData.get("quotation_document");
    if (file instanceof File && file.size > 0) {
      if (!isAllowedBidDocument(file)) return json({ quotation_document: "Only PDF and DOCX files are allowed." }, 400);
      quotationDocument = await saveFile(file, "bids");
    }
    const technicalFile = formData.get("technical_proposal_document");
    if (technicalFile instanceof File && technicalFile.size > 0) {
      if (!isAllowedBidDocument(technicalFile)) return json({ technical_proposal_document: "Only PDF and DOCX files are allowed." }, 400);
      technicalProposalDocument = await saveFile(technicalFile, "bids");
    }
    const supportingFile = formData.get("supporting_documents");
    if (supportingFile instanceof File && supportingFile.size > 0) {
      if (!isAllowedBidDocument(supportingFile)) return json({ supporting_documents: "Only PDF and DOCX files are allowed." }, 400);
      supportingDocuments = await saveFile(supportingFile, "bids");
    }
    const sigFile = formData.get("digital_signature");
    if (sigFile instanceof File && sigFile.size > 0) {
      digitalSignaturePath = await saveFile(sigFile, "bids");
    }
    if (typeof body.quotation_document === "string") {
      quotationDocument = body.quotation_document;
    }
  } else {
    body = await request.json();
    quotationDocument = body.quotation_document || body.quotation_file || null;
    technicalProposalDocument = body.technical_proposal_document || body.technical_proposal || null;
    supportingDocuments = body.supporting_documents || null;
    digitalSignaturePath = body.digital_signature || null;
  }

  const projectId = String(body.project || body.project_id || "").trim();
  const bidAmount = Number(body.bid_amount);
  const additionalRemarks = String(body.additional_remarks || body.proposal || "").trim();
  const noConflictOfInterest = parseBoolean(body.no_conflict_of_interest);
  const supplierDeclaration = parseBoolean(body.supplier_declaration || body.no_past_scm_issues);

  if (!projectId) return json({ project: "Project is required." }, 400);

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return json({ project: "Project not found." }, 400);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (project.deadline && new Date(project.deadline) < today) {
    return json({ error: `Bidding is closed. The deadline was ${project.deadline}.` }, 403);
  }
  if (project.status !== "active") {
    return json({ project: "Bidding is closed for this project." }, 403);
  }

  if (!Number.isFinite(bidAmount) || bidAmount <= 0) return json({ bid_amount: "Enter a valid bid amount." }, 400);
  if (bidAmount > Number(project.budget || 0)) return json({ bid_amount: "Offered price cannot exceed the approved budget." }, 400);
  if (!quotationDocument) return json({ quotation_document: "Quotation / Price Proposal is required." }, 400);
  if (!technicalProposalDocument) return json({ technical_proposal_document: "Technical Proposal / Specifications is required." }, 400);
  if (!supplierDeclaration) return json({ supplier_declaration: "Supplier declaration is required." }, 400);

  // Require signature presence for RA 9184 compliance
  const signatureName = String(body.signature_name || "").trim();
  if (!signatureName && !digitalSignaturePath) {
    return json({ signature: "Signature is required (name and signature image)." }, 400);
  }

  const existing = await db.bid.findUnique({ where: { project_id_supplier_id: { project_id: projectId, supplier_id: user!.id } } });
  if (existing) return json({ project: "You have already submitted a bid for this project." }, 409);

  const bid = await db.bid.create({
    data: {
      id: uuid(),
      project_id: projectId,
      supplier_id: user!.id,
      company_name: user!.company_name || "",
      bid_amount: bidAmount,
      proposal: additionalRemarks || "",
      quotation_file: quotationDocument,
      quotation_document: quotationDocument,
      technical_proposal: technicalProposalDocument,
      supporting_documents: supportingDocuments,
      no_conflict_of_interest: noConflictOfInterest,
      conflict_of_interest_person: null,
      no_past_scm_issues: supplierDeclaration,
      past_scm_issues_details: null,
      digital_signature: digitalSignaturePath,
      signature_name: signatureName || null,
      signature_signed_at: body.signature_signed_at ? new Date(String(body.signature_signed_at)) : (digitalSignaturePath ? new Date() : null),
      status: "submitted",
    },
  });

  // Recalculate ranks
  const allBids = await db.bid.findMany({ where: { project_id: projectId }, select: { id: true, bid_amount: true, submitted_at: true } });
  const ranked = recalculateRanks(allBids);
  for (const r of ranked) {
    await db.bid.update({ where: { id: r.id }, data: { rank: r.rank } });
  }

  await logAudit("SUBMIT_BID", user!.id, `Submitted bid for ${project.title}`, "bid", project.id);
  await notifyAdmins("new_bid", "New Bid Submitted", `${user!.company_name || user!.full_name} submitted an offered price of ₱${bidAmount.toLocaleString()} on ${project.title}.`, `/admin/bid-evaluation?project=${project.id}`, bid.id);

  // publish SSE for real-time clients
  try {
    publishEvent("bid_created", { id: bid.id, project_id: projectId, supplier_id: user!.id, bid_amount: Number(bidAmount), project_title: project.title });
  } catch (e) {
    // non-fatal
  }

  return json(bid, 201);
}
