// Script to parse the query and return a parsed query object
import { countyAliases } from './countyAliases';

const STOP = new Set(["the", "of", "in", "for", "and", "county"]);
const FILLER = ['in','at','for','the','show','me','jobs','job','county','above','over','greater','than','pay','salary','salaries','hourly','monthly'];
const QUESTION_WORDS = ['what', 'where', 'how', 'who', 'when', 'why', 'which', 'are', 'is', 'can', 'could', 'would', 'should', 'do', 'does'];

// Common job title prefixes
const JOB_PREFIXES = ['assistant', 'associate', 'senior', 'chief', 'director', 'deputy'];

export interface ParsedQuery {
  keywords: string[];
  jurisdiction?: string;
  salaryRange?: {
    min?: number;
    max?: number;
  };
}

export interface JobQuery {
  keywords?: string[];
  jurisdiction?: string;
  minSalary?: number;
  /** Indicates the cadence the user is referring to (hourly, monthly, annual). */
  salaryCadence?: 'hourly' | 'monthly' | 'annual';
}

/** Extract a number from a string like "$2,000" or "$2,000.50" */
function extractNumber(str: string): number | null {
  const m = str.match(/[\d,.]+/);
  if (!m) return null;
  const clean = m[0].replace(/,/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

/** Very light NLP: lower-case, trim, split on space/punct, drop stop-words */
export function parseQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase();
  let keywords = lower.split(/\s+/).filter(Boolean);

  // Salary range
  //TODO: add a type for the salary range, could use better code structure for conditionals
  //dictation stripping for parse query and title specific filtering 
  //TODO: add a type for the jurisdiction, could use better code structure for conditionals
  const salaryRange: { min?: number; max?: number } = {};
  if (/\$ *\d/.test(lower)) {
    const allNumbers = [...lower.matchAll(/\$ *([\d,.]+)/g)]
      .map((m) => extractNumber(m[0]))
      .filter((n): n is number => n != null);

    if (allNumbers.length === 1 && /greater than|above|over/.test(lower)) {
      salaryRange.min = allNumbers[0];
    } else if (allNumbers.length === 2) {
      salaryRange.min = Math.min(...allNumbers);
      salaryRange.max = Math.max(...allNumbers);
    } else if (allNumbers.length === 1) {
      salaryRange.min = allNumbers[0];
    }
  }

  // Jurisdiction extraction (simple example, can be improved)
  let jurisdiction: string | undefined;
  const inMatch = lower.match(/in ([a-z ]+)/);
  if (inMatch) {
    jurisdiction = inMatch[1].trim();
  }

  if (jurisdiction) {
    const jurTokens = jurisdiction.replace(/_/g,' ').split(' ').filter(Boolean);
    keywords = keywords.filter(w => !jurTokens.includes(w));
  }
  keywords = keywords.filter(w => !FILLER.includes(w));
  keywords = keywords.filter(Boolean);

  if (keywords.length === 0) keywords = undefined;

  return {
    keywords,
    jurisdiction,
    salaryRange: Object.keys(salaryRange).length ? salaryRange : undefined,
  };
}

// Try to identify job titles in user queries
function extractJobTitle(query: string): { jobTitle: string | null, remainingQuery: string } {
  query = query.toLowerCase();
  
  // Pattern for job titles like "Assistant Sheriff" or "Chief Probation Officer"
  const patterns = [
    // Match job titles like "Assistant Chief Probation Officer"
    /\b(assistant chief \w+ officer|assistant sheriff|associate meteorologist|assistant director[a-z ]+)\b/i,
    // Match job titles with prefixes
    new RegExp(`\\b(${JOB_PREFIXES.join('|')})\\s+(\\w+(?:\\s+\\w+){0,3})\\b`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const jobTitle = match[0];
      const remainingQuery = query.replace(jobTitle, '');
      return { jobTitle, remainingQuery };
    }
  }
  
  return { jobTitle: null, remainingQuery: query };
}

export function parseJobQuery(query: string): JobQuery {
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Extract jurisdiction if mentioned
  let jurisdiction: string | undefined;
  for (const [alias, county] of Object.entries(countyAliases)) {
    const aliasPattern = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (aliasPattern.test(lowercaseQuery)) {
      jurisdiction = county;
      break;
    }
  }

  // Extract salary if mentioned (e.g., "$50,000", "50k", etc.)
  const salaryMatch = lowercaseQuery.match(/\$?(\d[\d,]*k?|\d*\.?\d+k)/i);
  let minSalary: number | undefined;
  if (salaryMatch) {
    const salaryStr = salaryMatch[1].toLowerCase();
    if (salaryStr.endsWith('k')) {
      minSalary = parseFloat(salaryStr.replace(/k$/, '').replace(/,/g, '')) * 1000;
    } else {
      minSalary = parseFloat(salaryStr.replace(/,/g, ''));
    }
  }

  // Detect cadence keywords
  let salaryCadence: 'hourly' | 'monthly' | 'annual' | undefined;
  if (/hour|hr|hourly/.test(lowercaseQuery)) {
    salaryCadence = 'hourly';
  } else if (/month|monthly/.test(lowercaseQuery)) {
    salaryCadence = 'monthly';
  } else if (/year|annually|annual|per year/.test(lowercaseQuery)) {
    salaryCadence = 'annual';
  }

  // Try to identify job titles in the query
  const { jobTitle, remainingQuery } = extractJobTitle(lowercaseQuery);
  
  // Extract keywords (excluding jurisdiction, salary, and question words)
  let keywords = lowercaseQuery
    .replace(/\$?\d[\d,]*k?/g, '') // Remove salary
    .split(' ')
    .map(w => w.replace(/[^a-z0-9]/g, '')) // strip punctuation
    .filter(word => {
      // Filter out common words, jurisdiction terms, and question words
      const isCommonWord = FILLER.includes(word);
      const isQuestionWord = QUESTION_WORDS.includes(word);
      const isJurisdictionTerm = Object.keys(countyAliases).some(aliasKey => {
        const aliasRegex = new RegExp(`\\b${aliasKey.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        return aliasRegex.test(word);
      });
      return !isCommonWord && !isJurisdictionTerm && !isQuestionWord && word.length > 0;
    });

  // If we identified a job title, add it to keywords as a priority
  if (jobTitle) {
    // Split job title into individual words
    const jobTitleWords = jobTitle.split(/\s+/);
    // Add them to the beginning of the keywords array
    keywords = [...jobTitleWords, ...keywords];
  }

  // Detect and merge key phrases into single concept tokens
  const PHRASE_SYNONYMS: { pattern: RegExp; token: string }[] = [
    { pattern: /law enforcement/, token: 'law_enforcement' },
    { pattern: /district attorney/, token: 'district_attorney' },
    { pattern: /public information/, token: 'public_information' },
    { pattern: /human resources/, token: 'human_resources' },
    { pattern: /probation officer/, token: 'probation_officer' },
  ];

  PHRASE_SYNONYMS.forEach(({ pattern, token }) => {
    if (pattern.test(lowercaseQuery)) {
      keywords.push(token);
    }
  });

  if (jurisdiction) {
    const jurTokens = jurisdiction.replace(/_/g,' ').split(' ').filter(Boolean);
    keywords = keywords.filter(w => !jurTokens.includes(w));
  }

  // Remove overly short tokens which add noise
  keywords = keywords.filter(w => w.length >= 2);

  // Remove duplicates
  keywords = [...new Set(keywords)];

  keywords = keywords.filter(Boolean);
  if (keywords.length === 0) keywords = undefined;

  return {
    keywords,
    jurisdiction,
    minSalary,
    salaryCadence,
  };
}
