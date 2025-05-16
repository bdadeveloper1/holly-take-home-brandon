import { JobWithSalary } from './model';

// Using OpenAI instead of HuggingFace (llms) because I ran out of credits
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function callLLM(messages: ChatMessage[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Convert our messages format to OpenAI format
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // Call OpenAI API
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: formattedMessages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a response.";
}

export async function buildJobSearchPrompt(query: string, jobs: JobWithSalary[]): Promise<ChatMessage[]> {
  const systemPrompt = `You are a concise job search assistant. Summarize the available jobs and make relevant recommendations. Focus on key details like title, location, and salary. Be brief and direct.`;

  const jobsContext = jobs.map((job, idx) => {
    let salaryRange = 'Not specified';
    if (job.salaryGrades && job.salaryGrades.length > 0) {
      const amounts = job.salaryGrades.map(g => g.amount);
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      const cadence = job.salaryGrades[0].cadence;
      if (!isNaN(min) && !isNaN(max)) {
        salaryRange = `$${min.toLocaleString()} - $${max.toLocaleString()} ${cadence}`;
      }
    }
    return `${idx + 1}. ${job.title} (${job.jurisdiction}) - ${salaryRange}`;
  }).join('\n');

  const userPrompt = `Query: ${query}\n\nAvailable positions:\n${jobsContext}\n\nProvide a brief summary and relevant recommendations.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
} 