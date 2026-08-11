-- AlterTable: add error column and unique constraint on run_steps
ALTER TABLE "run_steps" ADD COLUMN IF NOT EXISTS "error" TEXT;

-- Remove duplicate (runId, nodeId) rows before adding unique constraint (keep latest)
DELETE FROM "run_steps" a
USING "run_steps" b
WHERE a.id < b.id
  AND a."runId" = b."runId"
  AND a."nodeId" = b."nodeId";

CREATE UNIQUE INDEX IF NOT EXISTS "run_steps_runId_nodeId_key" ON "run_steps"("runId", "nodeId");
