import { config } from "dotenv";
config({ path: ".env.local" });

import { syncFixtures } from "@/lib/jobs/sync-fixtures";
import { syncStats } from "@/lib/jobs/sync-stats";
import { generatePredictions } from "@/lib/jobs/generate-predictions";
import { syncResults } from "@/lib/jobs/sync-results";
import { prisma } from "@/lib/db/prisma";

const JOBS = {
  fixtures: syncFixtures,
  stats: syncStats,
  predictions: generatePredictions,
  results: syncResults,
} as const;

type JobName = keyof typeof JOBS;

function isJobName(value: string): value is JobName {
  return value in JOBS;
}

async function main() {
  const requested = process.argv[2] ?? process.env.SYNC_MODE;
  const jobNames = requested && isJobName(requested) ? [requested] : (Object.keys(JOBS) as JobName[]);

  if (requested && !isJobName(requested)) {
    console.error(`Unknown job "${requested}". Valid jobs: ${Object.keys(JOBS).join(", ")}`);
    process.exit(1);
  }

  for (const name of jobNames) {
    console.log(`\n[run-job] starting: ${name}`);
    const result = await JOBS[name]();
    console.log(`[run-job] finished: ${name}`);
    console.log(JSON.stringify(result, null, 2));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
