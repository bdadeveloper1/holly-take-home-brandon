
# Holly Chat Assistant

## About This Project

This is a simple chat interface frontend that simulates a conversation with an AI assistant named Holly. The application provides a clean, responsive user interface for sending messages and receiving automated responses.

## Technical Overview

### Frontend Architecture

This project is built using a modern React stack with TypeScript for type safety and code maintainability. Key technical components include:

- **React 18**: Component-based UI with hooks for state management
- **TypeScript**: Static typing for improved developer experience and fewer runtime errors
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Component library built on Radix UI primitives

### Core Components

The application is structured around several key components:

- **ChatMessage**: Renders individual messages with styling based on the sender (user vs assistant)
- **ChatInput**: Provides a text input field with send button functionality
- **LoadingIndicator**: Shows a typing animation while waiting for responses

### State Management

The application uses React's useState hook to manage:
- Message history (array of message objects)
- Loading states for UI feedback

### Development Setup

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build & Deploy

```sh
# Build for production
npm run build

# Preview production build
npm run preview
```

This application is designed to be easily extensible for integration with real backend services for actual AI chat functionality.