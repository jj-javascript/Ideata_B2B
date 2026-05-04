# Ideata App

Collaborative B2B brainstorming platform. Turn team ideas into outcomes with real-time whiteboarding, video meetings, and AI-powered ideation.

## Features

- **Real-time Collaboration** - Whiteboard with live cursors and presence
- **Video Meetings** - Built-in video conferencing with LiveKit
- **AI Ideation** - Generate and visualize ideas with AI assistance
- **Board Management** - Create, share, and organize ideation boards
- **Meeting Scheduling** - Schedule and manage team brainstorming sessions

## Tech Stack

- **Frontend**: Next.js 16, React 18, Tailwind CSS
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **Video**: LiveKit
- **AI**: OpenAI

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## Testing

```bash
# Run Playwright e2e tests
npm run test:pw

# Run with UI
npm run test:pw:ui
```

## License

MIT
