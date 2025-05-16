//In actions.ts, user queries are first parsed using parseJobQuery to extract keywords, jurisdiction, and salary requirements
//Then, the searchJobs function is called with the parsed query to retrieve relevant jobs
//The buildJobSearchPrompt function constructs the prompt for the LLM, and callLLM makes the API call to the LLM
//The response is then returned to the client

"use server";

import { parseJobQuery } from '../lib/queryParser';
import { searchJobs } from '../lib/jobSearch';
import { buildJobSearchPrompt, callLLM } from '../lib/llm';
import * as cache from '../lib/lruCache';

export async function handleChatMessage(query: string): Promise<string> {
  try {
    // Parse the user's query
    const searchParams = parseJobQuery(query);
    console.log('--- Parsed Query ---');
    console.log(JSON.stringify(searchParams, null, 2));

    // Search for relevant jobs
    const jobs = await searchJobs(searchParams);
    console.log('--- Search Results ---');
    if (jobs && jobs.length > 0) {
      console.log(`Found ${jobs.length} job(s):`);
      jobs.forEach((job, idx) => {
        console.log(`  [${idx + 1}] Title: ${job.title}, Jurisdiction: ${job.jurisdiction}, Code: ${job.code}`);
      });
    } else {
      console.log('No jobs found for these parameters.');
    }

    if (!jobs || jobs.length === 0) {
      return "I couldn't find any jobs matching your criteria. Could you try rephrasing your search?";
    }

    // Build the prompt with job context
    const messages = await buildJobSearchPrompt(query, jobs);
    
    // Get response from LLM
    const response = await callLLM(messages);
    
    return response;
  } catch (error) {
    console.error('Error in handleChatMessage:', error);
    return "I'm sorry, I encountered an error while processing your request. Please try again.";
  }
} 