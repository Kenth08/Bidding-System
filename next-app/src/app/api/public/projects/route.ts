import { db } from '@/lib/db';
import { json } from '@/lib/api-utils';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const section = url.searchParams.get('section') || 'open';
  const today = new Date();
  today.setHours(0,0,0,0);

  if (section === 'open') {
    // Active projects whose deadline has not passed and without a winning bid
    const projects = await db.project.findMany({ where: { status: 'active', deadline: { gte: today } }, orderBy: { created_at: 'desc' } });

    // Filter out projects that already have a winner (bid with status 'won' or blockchain record)
    const filtered: any[] = [];
    for (const p of projects) {
      const winningBid = await db.bid.findFirst({ where: { project_id: p.id, status: 'won' } });
      const hasRecord = (await (db as any).blockchainRecord?.findMany ? (await (db as any).blockchainRecord.findMany({ where: { project_id: p.id } })).length > 0 : false);
      if (!winningBid && !hasRecord) filtered.push(p);
    }

    return json(filtered);
  }

  // awarded section
  const blockchainAwards = (await (db as any).blockchainRecord?.findMany?.() ) || [];
  const results: any[] = [];

  for (const record of blockchainAwards) {
    if (!record.project) continue;
    results.push({
      id: record.project.id,
      title: record.project.title,
      procurement_type: record.project.procurement_type,
      budget: Number(record.project.budget || 0),
      awarded_at: record.project.awarded_at || record.recorded_at || record.project.updated_at,
      winner: record.winner?.company_name || record.winner?.full_name || record.bid?.company_name || '—',
      award_amount: Number(record.bid?.bid_amount || 0),
    });
  }

  // also include awarded projects without blockchain record
  const projects = await db.project.findMany({ where: { status: 'awarded' }, orderBy: { awarded_at: 'desc' } });
  for (const p of projects) {
    if (results.find((r) => r.id === p.id)) continue;
    const winningBid = await db.bid.findFirst({ where: { project_id: p.id, status: 'won' } });
    if (!winningBid) continue;
    const supplier = await db.user.findUnique({ where: { id: winningBid.supplier_id } });
    results.push({ id: p.id, title: p.title, procurement_type: p.procurement_type, budget: Number(p.budget || 0), awarded_at: p.awarded_at || p.updated_at, winner: supplier?.company_name || supplier?.full_name || winningBid.company_name, award_amount: Number(winningBid.bid_amount || 0) });
  }

  return json(results);
}
