ALTER TABLE "bids_bid"
ADD COLUMN IF NOT EXISTS "no_conflict_of_interest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "conflict_of_interest_person" TEXT,
ADD COLUMN IF NOT EXISTS "no_past_scm_issues" BOOLEAN NOT NULL DEFAULT false;
