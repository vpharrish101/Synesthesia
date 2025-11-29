# Synesthesia - Email Productivity Agent

Modern, elegant email management with AI assistance. Built with Next.js, React, and Tailwind CSS.

## Features

- **3-Column Layout**: Compact email list, detailed view, and optional RAG preview
- **Frosted Glass Design**: Beautiful glassmorphic UI with soft pinkish-purple palette
- **AI-Powered Search**: Semantic RAG search with Enter key, local keyword filtering
- **Auto-Draft Replies**: Generate draft replies with typewriter animation
- **Chat Assistant**: Floating AI assistant for contextual questions
- **Prompt Editor**: Customize system prompts in settings
- **Responsive Design**: Mobile-first, works on all devices

## Setup & Installation

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:8000`

### Installation

\`\`\`bash
# Install dependencies
npm install

# Configure API URL (optional)
cp .env.local.example .env.local
# Edit .env.local if your backend is on a different URL

# Run development server
npm run dev
\`\`\`

Visit `http://localhost:3000`

## Usage

### Email Management

- **Search**: Type to filter emails locally, press Enter for AI search
- **View Details**: Click an email card to view full content
- **Actions**: Check off action items directly on email detail
- **Auto-Draft**: Click "Auto-Draft" to generate replies with typewriter animation

### Compose

- Click the **+** button to open compose modal
- Save drafts (stored locally or in DB)
- Never auto-sends—requires explicit user action

### Chat Assistant

- **Bottom-right floating button** opens/closes chat
- Ask about selected email or global questions
- Uses email context when available

### Settings

- Edit all system prompts in `/settings`
- Changes save immediately to backend

## API Endpoints

- `GET /health` - Backend health check
- `GET /emails` - List all emails
- `GET /search?q=query` - Semantic search
- `POST /ds7m/ask` - Ask about email
- `POST /ds7m/autodraft` - Generate draft
- `POST /ds7m/superquery` - Global AI query
- `GET /prompts/get_all` - Get all prompts
- `POST /prompts/change_one` - Update prompts

## Customization

### Theme

Edit `app/globals.css` to customize:

\`\`\`css
--primary: #E6CFF6; /* Soft pinkish-purple */
--accent: #8EDDD9; /* Muted teal */
--background: #f8f6fb;
--text-primary: #2d3436;
\`\`\`

### Backend URL

Set `NEXT_PUBLIC_API_URL` in `.env.local`

## Deployment

\`\`\`bash
npm run build
npm run start
\`\`\`

Deploy to Vercel or any Node.js host.

## Testing

### Search Behavior

1. Type in search box → filters emails locally (instant)
2. Press Enter → performs RAG search, shows AI results

### Auto-Draft Animation

1. Open email detail
2. Click "Auto-Draft"
3. Text appears with typewriter effect (~50ms per char)
4. Can edit while typing

### Drafts

1. Compose an email
2. Click "Save Draft"
3. Visit `/drafts` to see saved drafts
