// scripts/database_normalization_script.ts
// Schema can grow, so this works for now but will need to be refactored to handle more data

const fs = require("fs");
const path = require("path");

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawJob {
  jurisdiction: string;
  code: string;
  title: string;
  description: string;
  [k: string]: any;
}

interface RawSalaryRow {
  Jurisdiction: string;
  "Job Code": string;
  [key: `Salary grade ${number}`]: string;
  [k: string]: any;
}

export type SalaryGrade = {
  grade: number;                  // 1–14
  amount: number;                 // e.g. 70.38
  cadence: "hourly" | "monthly";  // hourly if amt <=150, monthly otherwise
  currency: "USD";
};

export type Job = {
  jurisdiction: string;           // snake_case key
  jurisdictionDisplay: string;    // human-readable
  code: string;                   // preserved leading zeros
  title: string;
  description: string;
  keywords: string[];             // extracted keywords
};

export type JobWithSalary = Job & {
  salaryGrades: SalaryGrade[];    // [] if no grades
};

// ─── Configuration ────────────────────────────────────────────────────────────

// Only truly odd raw values need mapping here:
const JURISDICTION_OVERRIDES: Record<string, string> = {
  "sdcounty": "san_diego",
  "kerncounty": "kern",
  "sanbernardino": "san_bernardino",
  "ventura": "ventura",
};

// Map canonical → display name for UI
// ─── DISPLAY NAME MAP ─────────────────────────────────────────────────────────
const JURISDICTION_DISPLAY_MAP: Record<string, string> = {
    san_bernardino: "San Bernardino County",
    ventura:       "Ventura County",
    san_diego:      "San Diego County",
    kern:           "Kern County",
  };

// Track any totally unexpected raw strings:
const unseenJurisdictions = new Set<string>();

// ─── Normalization Functions ─────────────────────────────────────────────────

function normalizeJurisdiction(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  // remove "county" or abbreviations (regex)
  const noCounty = lower
    .replace(/\bcounty\b/, "")
    .replace(/\bcty\b/, "")
    .trim();

  // fallback: snake_case
  const fallback = noCounty
    .replace(/[^a-z0-9]+/g, "_")  // non-alnum → _
    .replace(/^_+|_+$/g, "")      // trim leading/trailing _
    .replace(/__+/g, "_");        // collapse repeats

  // apply override if known
  const key =
    JURISDICTION_OVERRIDES[lower]    ??
    JURISDICTION_OVERRIDES[noCounty] ??
    fallback;

  // mark new raws for review
  if (!JURISDICTION_OVERRIDES[lower] && key === fallback) {
    unseenJurisdictions.add(raw);
  }

  return key;
}

function getJurisdictionDisplay(jurKey: string): string {
  return JURISDICTION_DISPLAY_MAP[jurKey] ?? jurKey
    .split("_")
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

const salaryStrToNum = (s: string): number | null => {
  if (!s) return null;
  const num = parseFloat(s.replace(/[^\d.]/g, ""));
  return isNaN(num) ? null : num;
};

const detectCadence = (amt: number): "hourly" | "monthly" =>
  amt > 150 ? "monthly" : "hourly";

const extractKeywords = (description: string): string[] => {
  const lower = description.toLowerCase();
  const keywords = new Set<string>();

  // simple bullet/number extraction
  lower.split(/\n+/).forEach(line => {
    const t = line.trim();
    if (/^[0-9]+\.\s/.test(t) || /^[•⁃-]\s/.test(t)) {
      keywords.add(t);
    }
  });

  // some section phrases
  ["knowledge of", "skills and abilities", "ability to", "required", "experience", "education", "certification", "license"]
    .forEach(phrase => {
      const idx = lower.indexOf(phrase);
      if (idx !== -1) {
        const snippet = lower.substring(idx, idx + 100).split(/\n/)[0].trim();
        keywords.add(snippet);
      }
    });

  return Array.from(keywords);
};

// ─── Main Normalizer ─────────────────────────────────────────────────────────

export function normalizeData(): JobWithSalary[] {
  // load raw
  const bronzeDir = path.join(process.cwd(), "data/bronze");
  const rawJobs: RawJob[] = JSON.parse(
    fs.readFileSync(path.join(bronzeDir, "job_descriptions.raw.json"), "utf8")
  );
  const rawSalaries: RawSalaryRow[] = JSON.parse(
    fs.readFileSync(path.join(bronzeDir, "salaries.raw.json"), "utf8")
  );

  // normalize salaries → silver
  const salaryTable: Record<string, SalaryGrade[]> = {};
  for (const row of rawSalaries) {
    if (!row.Jurisdiction || !row["Job Code"]) continue;
    const jur = normalizeJurisdiction(row.Jurisdiction);
    const code = String(row["Job Code"]).trim().padStart(5, "0");
    const key = `${jur}|${code}`;
    const grades: SalaryGrade[] = [];

    for (let i = 1; i <= 14; i++) {
      const raw = row[`Salary grade ${i}`]?.trim() ?? "";
      const amt = salaryStrToNum(raw);
      if (amt !== null && amt > 0) {
        grades.push({ grade: i, amount: amt, cadence: detectCadence(amt), currency: "USD" });
      }
    }

    if (grades.length) salaryTable[key] = grades;
  }

  // normalize jobs
  const silverJobs: Job[] = rawJobs.map(j => {
    const jurKey = normalizeJurisdiction(j.jurisdiction);
    return {
      jurisdiction: jurKey,
      jurisdictionDisplay: getJurisdictionDisplay(jurKey),
      code: String(j.code).trim().padStart(5, "0"),
      title: j.title.trim(),
      description: j.description.trim(),
      keywords: extractKeywords(j.description),
    };
  });

  // join → gold
  const gold: JobWithSalary[] = silverJobs.map(job => ({
    ...job,
    salaryGrades: salaryTable[`${job.jurisdiction}|${job.code}`] ?? [],
  }));

  // build a simple search index
  const searchIndex = gold.map(job => ({
    id: `${job.jurisdiction}|${job.code}`,
    titleTokens: job.title.toLowerCase().split(/\s+/),
    jurisdiction: job.jurisdiction,
    jurisdictionDisplay: job.jurisdictionDisplay,
    hasSalary: job.salaryGrades.length > 0,
  }));

  // write out silver & gold layers
  const silverDir = path.join(process.cwd(), "data/silver");
  const goldDir   = path.join(process.cwd(), "data/gold");
  [silverDir, goldDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

  fs.writeFileSync(
    path.join(silverDir, "salaries.normalized.json"),
    JSON.stringify(salaryTable, null, 2)
  );
  fs.writeFileSync(
    path.join(silverDir, "job_descriptions.normalized.json"),
    JSON.stringify(silverJobs, null, 2)
  );
  fs.writeFileSync(
    path.join(goldDir, "jobs_with_salary.json"),
    JSON.stringify(gold, null, 2)
  );
  fs.writeFileSync(
    path.join(goldDir, "search_index.json"),
    JSON.stringify(searchIndex, null, 2)
  );

  // log any unseen jurisdictions
  if (unseenJurisdictions.size) {
    console.warn("⚠️  Unmapped jurisdictions detected:", [...unseenJurisdictions]);
  }

  console.log(
    `✅ Bronze→Silver→Gold complete: ${gold.length} jobs, ${Object.keys(salaryTable).length} salary entries`
  );
  return gold;
}

// auto-run if invoked directly
if (require.main === module) {
  normalizeData();
}
