# Project Architecture & Implementation Details

## Project Overview

This project implements an HR assistant chatbot capable of answering queries about job positions and salaries. The system intelligently parses user queries, extracts relevant information, filters the job database accordingly, and provides natural language responses using an LLM.

## Development Timeline

The project took approximately 4 hours to complete, going slightly over the suggested timeframe as I became deeply invested in optimizing the query parsing and LLM integration. The time was distributed across:

- **1 hour**: Initial data processing and normalization
- **1 hours**: Building the chat interface and styling
- **2 hours**: Implementing query parsing and job search logic, LLM integration and response formatting

## Data Pipeline Architecture

The project implements a medallion data architecture pattern with three layers:

### Bronze Layer
- Raw data from source JSON files (job-descriptions.json and salaries.json)
- Contains unprocessed, original format data

### Silver Layer
- Normalized data with consistent schema
- Created through transformation scripts

### Gold Layer
- Enriched, query-optimized data
- Joined job descriptions with salary information
- Used for serving the application

## Core Components

### Data Processing (`scripts/database_normalization_script.ts`)
- Transforms raw data into normalized, queryable format
- Joins job descriptions with salary information
- Creates the gold layer data for efficient querying

### Query Parser (`lib/queryParser.ts`)
- Analyzes natural language queries using regex and string parsing
- Identifies key components like:
  - Keywords for job roles
  - Jurisdiction/county information
  - Salary requirements with cadence (hourly/monthly/annual)
- Handles variations in how users might phrase queries
- Uses county aliases to standardize jurisdiction references

### Job Search Engine (`lib/jobSearch.ts`)
- Implements the filtering logic to retrieve relevant job listings
- Applies keyword matching with synonym expansion
- Filters by jurisdiction and salary requirements
- Ranks results by relevance
- Uses an LRU cache to improve performance on repeated queries

### LLM Integration (`lib/llm.ts` & `lib/llmPromptEngine.ts`)
- Connects with OpenAI or Hugging Face models
- Constructs prompts with only the most relevant job data
- Formats responses for readability
- Removes prompt artifacts from LLM responses

### Chat Interface Components

#### Main Chat Interface (`app/chat_app_front_end/ChatInterface.tsx`)
- Responsive UI built with Tailwind CSS
- Message styling with clear user/assistant differentiation
- Implements typing indicators and loading states
- Connected to the backend via Next.js Server Actions
- Dark mode support with system preference detection

#### Modern Chat Pulse UI (`app/modern-chat-pulse/`)
- Enhanced, production-ready chat interface with polished styling
- Mobile-first responsive design
- Dynamic chat bubbles with subtle animations
- Color-coded messages (blue for user, green for AI assistant)
- Message timestamps with localization

#### Loading Indicator (`app/modern-chat-pulse/src/components/ChatUI/LoadingIndicator.tsx`)
- Animated loading dots using CSS animations
- Visual feedback during API calls and LLM processing
- Accessibility considerations with proper ARIA labels
- Smooth transitions between states

#### Chat Input (`app/modern-chat-pulse/src/components/ChatUI/ChatInput.tsx`)
- Real-time input validation
- Mobile-optimized keyboard experience
- Disabled state during processing to prevent duplicate submissions
- Send button that dynamically updates based on input state

## UI/UX Design Approach

### Mobile-First Design Philosophy
- Developed with mobile interaction (apple) interface in mind from the beginning
- Flexible layouts that adapt to screen sizes using Tailwind's responsive classes
- Bottom-fixed input bar for ergonomic typing 

### Color Scheme and Visual Design
- Professional blue/green color scheme replacing the initial pink design
- User messages in blue (right-aligned) and AI responses in green (left-aligned)
- Dark mode implementation with smooth transitions between light/dark themes
- System preference detection for automatic dark/light mode selection
- Subtle animations for message appearance and loading states

### User Experience Enhancements
- Visual loading indicators with animated dots during API calls
- Clear visual distinction between user and AI messages
- Timestamps on messages for conversation context
- Auto-scrolling to the latest message
- Responsive design with adaptive layouts for all screen sizes
- Keyboard-friendly navigation and submission

## Technical Implementation

### Frontend Technologies
- **Next.js 14**: Leveraging the App Router for improved routing and server component architecture
- **Tailwind CSS**: For responsive, utility-first styling
- **TypeScript**: Strong typing throughout for code reliability
- **Server Actions**: Used for handling chat interactions without a dedicated backend

### Backend Processing
- **Query Parsing**: Sophisticated regex and string manipulation for understanding user intent
- **Data Filtering**: Efficient algorithms to retrieve only relevant job information
- **LLM Integration**: Structured prompting to get consistent, helpful responses

### Design Decisions

1. **Medallion Architecture**: I implemented the bronze/silver/gold data pipeline to create a clean separation between raw data and application-ready data. This made it easier to apply transformations incrementally.

2. **Local Query Processing**: Instead of relying on vector embeddings or complex NLP models for query understanding, I built a robust regex-based system. This approach:
   - Reduces dependencies
   - Eliminates the need for embedding databases
   - Keeps the solution lightweight and performant

3. **County Alias System**: I created a flexible aliasing system to handle variations in how users might refer to jurisdictions ("San Diego" vs "SD" vs "san diego county").

4. **Keyword Synonym Expansion**: To improve recall, I implemented a synonym mapping system for specialized terms (e.g., "meteorology" → ["meteorology", "meteorologist", "weather", "air quality"]).

5. **Salary Cadence Detection**: The system intelligently detects whether users are referring to hourly, monthly, or annual salaries and normalizes values appropriately.

6. **Responsive UI Design**: The chat interface was designed to be fully functional on both desktop and mobile devices:
   - Fluid containers that adapt to viewport size
   - Touch-friendly input components
   - Appropriate spacing and typography for all screen/browser sizes


7. **Visual Feedback System**: Multiple visual indicators keep the user informed:
   - Animated dots during loading states
   - Color-coded messages for clear conversation flow
   - Clear status indicators during processing
   - Smooth transitions and subtle animations to indicate state changes

## LLM Integration Details

The project supports two LLM providers:

### OpenAI Integration (Default)
1. Set up a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
2. The system uses the gpt-3.5-turbo model by default (configured in `lib/llmPromptEngine.ts`)

### Hugging Face Integration (Alternative)
1. Set up a `.env.local` file with your Hugging Face API key:
   ```
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   ```
2. In `lib/llm.ts`, uncomment the Hugging Face implementation and comment out the OpenAI implementation

## Challenges and Solutions

### 1. Query Understanding
The most significant challenge was reliably extracting user intent from natural language queries. The solution involved:
- Building a robust regex system for identifying query components
- Implementing a flexible county alias system
- Creating keyword expansion to handle related terms

### 2. Salary Normalization
Dealing with different salary formats (hourly, monthly, annual) and user expressions required careful normalization:
- Detection of salary mentions including with K abbreviations ($60K)
- Cadence detection from contextual phrases ("hourly", "per month", "annual")
- Conversion between different cadence types for comparison

### 3. LLM Response Formatting
Ensuring consistent, helpful responses from the LLM required:
- Carefully structured prompts that guide the LLM
- Post-processing to remove prompt artifacts
- Error handling for API limitations

### 4. Mobile-Optimized UI
Creating a responsive experience across devices required:
- Testing on multiple screen sizes during development
- Optimizing tap targets for mobile users
- Ensuring keyboard functionality worked well on mobile
- Implementing smooth scrolling and appropriate text sizing

## Future Improvements

Given more time, I would enhance the project with:

1. **Vector Embeddings**: Implement semantic search using embeddings for more nuanced query understanding

2. **Multi-query Support**: Enable the system to handle compound queries that ask about multiple jobs or comparisons

3. **UI Enhancements**: Add features like message persistence, chat history, and improved mobile responsiveness

4. **Performance Optimization**: Implement more sophisticated caching and data indexing

5. **Expanded Test Coverage**: Create comprehensive unit and integration tests

6. **Advanced UI Features**: Implement voice input, rich text formatting for responses, and downloadable chat histories

## References and Inspirations

- [AI Chatbot Frontend Design](https://medium.com/@codeawake/ai-chatbot-frontend-1823b9c78521)
- The medallion architecture pattern (Bronze/Silver/Gold) inspired by modern data processing pipelines
- Next.js App Router and Server Actions documentation
- Modern mobile chat application design patterns from WhatsApp and Telegram

## Conclusion

In this take-home I ended up building a slick Next.js chat interface wired to a tiny “medallion” JSON pipeline that I wrote in TypeScript. I spent most of my time normalizing messy job descriptions and salary data into a deterministic Gold file, then wrote a lightweight parser + fuzzy matching search so that I only ever pass the single matching job into the LLM. Along the way I learned how powerful a simple Bronze→Silver→Gold approach can be for both reproducibility and performance, and why stripping commas before parseFloat matters!

The biggest challenges were wrangling free-form text fields—splitting out KSAs and duties—and handling inconsistent salary formats in JSON, all while staying inside a 2–3 hour window. I got really into this so I definitely went over in time.  I also had to balance prompt size (to control token costs) with giving the model enough context to answer accurately. 

Ultimately, this project taught me that a clear, pluggable architecture and well-typed utilities will win every time over over-engineered NLP pipelines—especially when you know exactly where you can drop in advanced tech (embeddings, vector DBs, DBOS logging for monitoring new data adds in the pipeline) once you need to scale. Fun take home 😊