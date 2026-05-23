export interface BlockchainRecord {
  id: string;
  project: string;
  bid: string;
  winner: string;
  bid_amount: number;
  hash: string;
  project_ref_id: string | null;
  recorded_at: string;
}
