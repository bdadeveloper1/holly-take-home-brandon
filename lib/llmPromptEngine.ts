// src/lib/promptEngine.ts
import { JobWithSalary } from "./model";

export function buildPrompt(job: JobWithSalary, question: string) {
  const salaryLines =
    job.salaryGrades.length > 0
      ? job.salaryGrades
          .map(
            (g) =>
              `• Grade ${g.grade}: $${g.amount}/${g.cadence} ${g.currency}`
          )
          .join("\n")
      : "• No salary information provided.";

  return `
You are Holly's HR assistant.
Only answer with the information supplied below.

---
Job Title: ${job.title}
County   : ${job.jurisdictionDisplay}
Job Code : ${job.code}

Salary Grades
${salaryLines}

Description
${job.description.slice(0, 1500)}   <!-- keep prompt small -->
---

User Question: ${question}

Answer (concise, bullet where useful):
`;
}

/* --- thin wrapper around OpenAI (can swap) --- */
export async function callLLM(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "Sorry, no answer.";
}
