// ─── MODEL ───────────────────────────────────────────────────────────────────────
//Shows the data model and types for the json data
//TODO: add a type for the job with salary, works for now but not scalable in that schema can grow

export interface SalaryGrade {
    grade: number;
    amount: number;
    cadence: "hourly" | "monthly" | "annual";
    currency: string;
}

export interface Job {
    jurisdiction: string;
    jurisdictionDisplay: string;
    code: string;
    title: string;
    description: string;
}

export interface JobWithSalary extends Job {
    salaryGrades: SalaryGrade[];
}

