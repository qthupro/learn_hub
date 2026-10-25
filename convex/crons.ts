import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Per-visitor page visit rows are only needed to dedupe the current day.
crons.cron("delete old page visits", "0 3 * * *", internal.visits.deleteOldVisits, {});

export default crons;
