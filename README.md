# Holly Engineering Take-Home: Chat HR Assistant

A Next.js application that provides a chat interface for users to query job and salary information stored in JSON files. This HR assistant can answer questions about job descriptions and compensation using natural language processing.

## Features

- Interactive chat interface with styled messages
- Smart query parsing to identify job information needs
- Efficient filtering of job data before LLM interaction
- Responsive design with Tailwind CSS

## Quick Start

1. Clone the repository
2. Create a `.env.local` file with your API key (see Environment Setup below)
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000/chat](http://localhost:3000/chat) in your browser

## Environment Setup

Create a `.env.local` file in the project root with one of the following options:

```bash
# Option 1: OpenAI (Default)
OPENAI_API_KEY=your_openai_api_key_here

# Option 2: Hugging Face
# HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

## Example Queries

Try these example questions in the chat interface:

- "What is the salary for the Assistant Chief Probation Officer in San Bernardino?"
- "What are the knowledge, skills, and abilities for the Assistant Sheriff San Diego County position?"
- "Are there any meteorology-related jobs with competitive salaries?"
- "Compare assistant roles across all counties"

## Detailed Documentation

For more detailed information about the architecture, implementation decisions, my notes and development process, see the [ARCHITECTURE.md](ARCHITECTURE.md) file.

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI API integration
- Server Actions for backend logic
