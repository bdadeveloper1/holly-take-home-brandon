// src/lib/jobSearch.ts
//TODO: implement Fuse.js for better search results, add nlp approach to expand queries (spacy???)
import fs from 'fs';
import path from 'path';
import type { JobWithSalary } from './model';
import type { JobQuery } from './queryParser';
// Ran out time but could implement Fuse.js for better search results
// import Fuse from 'fuse.js';

let jobsCache: JobWithSalary[] = [];

function loadJobs(): JobWithSalary[] {
  if (jobsCache.length > 0) return jobsCache;
  
  const goldDir = path.join(process.cwd(), 'data/gold');
  const jobsPath = path.join(goldDir, 'jobs_with_salary.json');
  
  try {
    const data = fs.readFileSync(jobsPath, 'utf8');
    jobsCache = JSON.parse(data);
    return jobsCache;
  } catch (error) {
    console.error('Error loading jobs:', error);
    return [];
  }
}

// Simple synonym map to improve recall for specialized terms
const SYNONYM_MAP: Record<string, string[]> = {
  meteorology: ['meteorology', 'meteorologist', 'weather', 'air quality'],
  weather: ['meteorology', 'meteorologist', 'weather', 'air quality'],
  sheriff: ['sheriff', 'law enforcement', 'deputy', 'corrections'],
  probation: ['probation', 'parole', 'community corrections'],
  law_enforcement: ['law enforcement', 'sheriff', 'probation', 'police'],
  district_attorney: ['district attorney', 'da', 'prosecutor', 'attorney'],
  public_information: ['public information', 'communications', 'public relations', 'pr'],
  human_resources: ['human resources', 'hr', 'personnel'],
  officer: ['officer', 'official', 'staff', 'personnel'],
  assistant: ['assistant', 'deputy', 'associate'],
  chief: ['chief', 'head', 'lead', 'principal', 'senior']
};

// Common job title parts for better matching
const JOB_TITLE_PARTS = ['assistant', 'associate', 'chief', 'director', 'sheriff', 'meteorologist', 'probation', 'officer'];

function expandKeyword(word: string): string[] {
  // Remove common suffix like 'related'
  const base = word.endsWith('related') ? word.replace(/related$/, '') : word;
  const synonyms = SYNONYM_MAP[base] || [];
  return Array.from(new Set([base, word, ...synonyms]));
}

function salaryToAnnual(amount: number, cadence: 'hourly' | 'monthly' | 'annual'): number {
  switch (cadence) {
    case 'hourly':
      return amount * 2080; // 52 weeks * 40 hours
    case 'monthly':
      return amount * 12;
    case 'annual':
    default:
      return amount;
  }
}

// Check if a query contains job title parts (more lenient matching)
function matchesJobTitle(title: string, queryKeywords: string[]): boolean {
  title = title.toLowerCase();
  
  // Special handling for specific job titles that are often searched
  if (queryKeywords.includes('assistant') && queryKeywords.includes('sheriff') &&
      title.includes('assistant') && title.includes('sheriff')) {
    return true;
  }
  
  if (queryKeywords.includes('assistant') && queryKeywords.includes('chief') && 
      queryKeywords.includes('probation') && queryKeywords.includes('officer') &&
      title.includes('assistant') && title.includes('chief') && 
      title.includes('probation') && title.includes('officer')) {
    return true;
  }
  
  // General matching - more words in common means better match
  let matchCount = 0;
  for (const part of JOB_TITLE_PARTS) {
    if (title.includes(part) && queryKeywords.includes(part)) {
      matchCount++;
    }
  }
  
  // If we match at least 2 significant parts of a job title, consider it a match
  return matchCount >= 2;
}

export function searchJobs(query: JobQuery): JobWithSalary[] {
  let candidates = loadJobs();
  console.log("--- Parsed Query ---");
  console.log(JSON.stringify(query, null, 2));

  // 1. Filter by jurisdiction if provided
  if (query.jurisdiction) {
    const qJur = query.jurisdiction.replace(/_/g, ' ').toLowerCase();
    candidates = candidates.filter(j => {
      const jJur = j.jurisdiction.replace(/_/g, ' ').toLowerCase();
      return jJur.includes(qJur);
    });
  }

  // 2. Check for job title matches first - use more lenient matching for job titles
  let titleMatches: JobWithSalary[] = [];
  if (query.keywords && query.keywords.length > 0) {
    titleMatches = candidates.filter(job => matchesJobTitle(job.title, query.keywords!));
    
    // If we got title matches and have a jurisdiction, this is likely what the user wanted
    if (titleMatches.length > 0 && query.jurisdiction) {
      candidates = titleMatches;
    }
    // If we have no jurisdiction but got title matches, still prioritize them
    else if (titleMatches.length > 0) {
      candidates = titleMatches;
    }
    // Otherwise, fall back to regular keyword search but make it more lenient
    else {
      candidates = candidates.filter(job => {
        const searchText = `${job.title} ${job.description}`.toLowerCase();
        
        // More lenient - match ANY of the important keywords (not ALL)
        // but require at least 2 matches to avoid too many results
        let matchCount = 0;
        for (const raw of query.keywords!) {
          const variants = expandKeyword(raw.toLowerCase());
          if (variants.some(v => searchText.includes(v))) {
            matchCount++;
          }
        }
        
        return matchCount >= Math.min(2, query.keywords!.length);
      });
    }
  }

  // 3. Filter by minimum salary if specified
  if (query.minSalary != null) {
    const cadencePreference = query.salaryCadence || 'hourly';
    candidates = candidates.filter(job =>
      job.salaryGrades && job.salaryGrades.some(g => {
        let compareAmount: number;
        if (cadencePreference === 'hourly') {
          // If user asked for hourly, compare directly if grade cadence hourly else convert downward
          if (g.cadence === 'hourly') {
            compareAmount = g.amount;
          } else {
            // Convert non-hourly to hourly equivalent
            const annual = salaryToAnnual(g.amount, g.cadence);
            compareAmount = annual / 2080;
          }
        } else {
          // annual or monthly preference -> compare on annual equivalence
          compareAmount = salaryToAnnual(g.amount, g.cadence);
        }
        return compareAmount >= query.minSalary!;
      })
    );
  }

  console.log("--- Search Results ---");
  if (candidates.length === 0) {
    console.log("No jobs found for these parameters.");
  } else {
    console.log(`Found ${candidates.length} job(s):`);
    candidates.forEach((job, i) => {
      console.log(`  [${i+1}] Title: ${job.title}, Jurisdiction: ${job.jurisdiction}, Code: ${job.code}`);
    });
  }
  
  return candidates;
}
