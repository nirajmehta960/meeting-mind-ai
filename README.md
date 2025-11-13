# MeetingMind - AI Meeting Assistant

<div align="center">

**Transform meeting chaos into actionable insights**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Live Demo](https://meeting-mind-ai.vercel.app) • [Report Bug](https://github.com/nirajmehta960/meeting-mind-ai/issues) • [Request Feature](https://github.com/nirajmehta960/meeting-mind-ai/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Development](#-development)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [File Support](#-file-support)
- [AI Models](#-ai-models)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🎯 Overview

**MeetingMind** is an AI-powered meeting assistant that transforms meeting transcripts and notes into actionable insights. Built for professionals who want to extract maximum value from their meetings, MeetingMind provides instant summaries, action items, stakeholder emails, and comprehensive analysis using state-of-the-art AI models.

### Key Capabilities

- **Smart Summarization**: Extract key points, decisions, and insights from meeting transcripts
- **Action Item Extraction**: Automatically identify tasks, owners, and deadlines
- **Email Generation**: Create professional stakeholder update emails
- **Multi-Format Support**: Process PDFs, Word documents, text files, and markdown
- **Conversation Management**: Save and organize multiple meeting analyses
- **Real-time Streaming**: Watch AI responses generate in real-time
- **Model Selection**: Choose between Claude 3.5 Sonnet and GPT-4o Mini

---

## ✨ Features

### Core Features

- 🤖 **AI-Powered Analysis**: Leverage Claude 3.5 Sonnet and GPT-4o Mini for comprehensive meeting analysis
- 📄 **Multi-Format File Processing**: Support for PDF, DOCX, TXT, and MD files
- 💬 **Conversation Management**: Save, search, rename, and delete conversation history
- 🔄 **Streaming Responses**: Real-time AI response generation with markdown rendering
- 🎨 **Modern UI**: Clean, ChatGPT-inspired interface with dark mode support
- 📱 **Responsive Design**: Fully responsive layout for desktop, tablet, and mobile
- 🎯 **Quick Actions**: Pre-built prompts for common meeting analysis tasks
- 📋 **Template Library**: Access to prompt templates for different use cases
- 🎤 **Voice Input**: Voice-to-text transcription support
- 🔍 **Search Functionality**: Quickly find conversations by title or content

### Advanced Features

- **Context-Aware Analysis**: AI adapts analysis style based on meeting type
- **People Tracking**: Identify speakers and their contributions
- **Decision Extraction**: Highlight key decisions and their context
- **Follow-up Planning**: Generate structured follow-up plans
- **Local Storage**: All conversations stored locally in browser (privacy-first)
- **Export Capabilities**: Copy and download meeting summaries
- **Regeneration**: Regenerate AI responses with different approaches
- **File Preview**: Preview processed files before sending

---

## 🛠 Tech Stack

### Frontend

- **React 18.3** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Styling
- **React Router 6.3** - Routing
- **Shadcn/ui** - UI component library
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering
- **Sonner** - Toast notifications

### AI & Processing

- **OpenRouter API** - AI model access (Claude & GPT)
- **PDF.js** - PDF text extraction
- **Mammoth.js** - DOCX file processing
- **React Syntax Highlighter** - Code syntax highlighting

### Development Tools

- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 📁 Project Structure

```
meeting-mind/
├── public/                    # Static assets
│   ├── favicon.svg           # Application favicon
│   ├── images/               # Logo images
│   │   ├── chatgpt-logo.jpg  # GPT model logo
│   │   └── claude-logo.jpg   # Claude model logo
│   └── pdf.worker.min.mjs    # PDF.js worker
├── src/
│   ├── components/           # React components
│   │   ├── chat/            # Chat-related components
│   │   │   ├── ChatInterface.tsx      # Main chat interface
│   │   │   ├── ChatInput.tsx          # Message input component
│   │   │   ├── ChatMessages.tsx       # Message list component
│   │   │   ├── MarkdownMessage.tsx    # Markdown rendering
│   │   │   ├── StreamingMessage.tsx   # Real-time streaming
│   │   │   ├── TemplatesModal.tsx      # Prompt templates
│   │   │   ├── VoiceInput.tsx         # Voice input
│   │   │   └── ...                    # Other chat components
│   │   ├── MeetingMindLogo.tsx        # Logo component
│   │   └── ui/                       # Shadcn/ui components
│   ├── services/             # Business logic
│   │   ├── openRouterService.ts      # OpenRouter API integration
│   │   └── fileProcessor.ts         # File processing logic
│   ├── utils/                # Utility functions
│   │   ├── conversationStorage.ts   # Local storage management
│   │   └── aiService.ts             # AI service utilities
│   ├── types/                # TypeScript types
│   │   └── ai.ts            # AI model types
│   ├── hooks/                # Custom React hooks
│   │   └── use-debounce.ts  # Debounce hook
│   ├── data/                 # Static data
│   │   └── sampleTranscript.ts      # Sample transcript
│   ├── pages/                # Page components
│   │   ├── Index.tsx        # Main page
│   │   └── NotFound.tsx    # 404 page
│   ├── lib/                 # Library utilities
│   │   └── utils.ts        # General utilities
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **OpenRouter API Key** - Get yours at [openrouter.ai](https://openrouter.ai/)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/nirajmehta960/meeting-mind-ai.git
cd meeting-mind-ai
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenRouter API key:

```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

4. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

---

## 📖 Usage Guide

### Basic Workflow

1. **Start a New Chat**: Click "New Chat" in the sidebar or use the landing page
2. **Upload or Paste Content**:
   - Drag and drop files (PDF, DOCX, TXT, MD)
   - Click the paperclip icon to select files
   - Paste meeting transcript directly into the input
3. **Choose Your Action**:
   - Use quick action buttons (Summarize, Action Items, Email Draft, Decisions)
   - Type a custom prompt
   - Select from prompt templates
4. **Review Results**: View the AI-generated analysis with markdown formatting
5. **Manage Conversations**: Rename, search, or delete conversations from the sidebar

### Quick Actions

- **📝 Summarize**: Get a comprehensive meeting summary
- **✅ Action Items**: Extract tasks with owners and deadlines
- **📧 Email Draft**: Generate stakeholder update emails
- **🎯 Decisions**: Identify key decisions and their context

### File Processing

Supported file formats:
- **PDF** (.pdf) - Text extraction via PDF.js
- **Word Documents** (.docx) - Processed via Mammoth.js
- **Text Files** (.txt) - Direct text processing
- **Markdown** (.md) - Preserved formatting

### Conversation Management

- **Save Conversations**: Automatically saved to browser local storage
- **Search**: Use the search bar to find conversations by title or content
- **Rename**: Click the three-dot menu to rename conversations
- **Delete**: Remove conversations you no longer need
- **Export**: Copy or download meeting summaries

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server (port 8080)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Structure

- **Components**: Reusable UI components in `src/components/`
- **Services**: Business logic and API calls in `src/services/`
- **Utils**: Helper functions in `src/utils/`
- **Types**: TypeScript type definitions in `src/types/`
- **Hooks**: Custom React hooks in `src/hooks/`

### Key Components

- **ChatInterface**: Main application interface with sidebar and chat area
- **OpenRouterService**: Handles all AI model interactions
- **FileProcessor**: Processes uploaded files and extracts text
- **ConversationStorage**: Manages local storage for conversations

### Development Guidelines

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with React and TypeScript rules
- **Component Structure**: Functional components with hooks
- **State Management**: React hooks (useState, useEffect, useRef)
- **Styling**: Tailwind CSS with custom design tokens

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add `VITE_OPENROUTER_API_KEY` in Vercel dashboard
3. **Deploy**: Automatic deployment on every push to main branch

**Vercel Configuration**:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Other Platforms

The application can be deployed to any platform supporting Node.js:

- **Netlify**: Similar setup to Vercel
- **Railway**: Add environment variables in dashboard
- **AWS Amplify**: Configure build settings
- **Cloudflare Pages**: Set build command and environment variables

### Environment Variables

Ensure `VITE_OPENROUTER_API_KEY` is set in your deployment platform's environment variables.

---

## 🔐 Environment Variables

### Required

```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**How to get your API key**:
1. Visit [openrouter.ai](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to Keys section
4. Create a new API key
5. Copy and paste into your `.env` file

### Optional

No optional environment variables are currently required. All features work with just the OpenRouter API key.

---

## 📄 File Support

### Supported Formats

| Format | Extension | Processing Method |
|--------|-----------|-------------------|
| PDF | `.pdf` | PDF.js text extraction |
| Word Document | `.docx` | Mammoth.js conversion |
| Text File | `.txt` | Direct text reading |
| Markdown | `.md` | Direct text reading |

### File Size Limits

- **Recommended**: Files under 10MB for optimal performance
- **Maximum**: Browser-dependent (typically 50-100MB)
- **Processing Time**: Varies by file size and complexity

### File Processing Features

- **Multiple Files**: Upload and process multiple files at once
- **Progress Tracking**: Visual progress indicators during processing
- **Error Handling**: Clear error messages for unsupported formats
- **File Preview**: View processed file content before sending

---

## 🤖 AI Models

### Available Models

1. **Claude 3.5 Sonnet** (Default)
   - Provider: Anthropic
   - Best for: Comprehensive analysis, detailed summaries
   - Max Tokens: 8,192
   - Temperature: 0.7

2. **GPT-4o Mini**
   - Provider: OpenAI
   - Best for: Quick responses, cost-effective analysis
   - Max Tokens: 8,192
   - Temperature: 0.7

### Model Selection

- Switch between models using the dropdown in the header
- Model selection persists across conversations
- Each model has optimized prompts for meeting analysis

### API Configuration

- **Provider**: OpenRouter (unified API for multiple models)
- **Streaming**: Real-time response generation
- **Error Handling**: Automatic retries and error recovery
- **Rate Limiting**: Handled by OpenRouter

---

## 🎨 UI/UX Features

### Design System

- **Color Scheme**: Custom theme with dark mode support
- **Typography**: Inter font family for readability
- **Spacing**: Consistent 8px grid system
- **Components**: Shadcn/ui component library

### Responsive Design

- **Desktop**: Full sidebar and chat interface
- **Tablet**: Collapsible sidebar
- **Mobile**: Hamburger menu for sidebar access

### Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and semantic HTML
- **Focus Management**: Proper focus indicators
- **Color Contrast**: WCAG AA compliant

---

## 🔒 Privacy & Security

### Data Storage

- **Local Storage Only**: All conversations stored in browser
- **No Server Upload**: Files processed client-side
- **Privacy First**: No data sent to external servers except OpenRouter API
- **No Tracking**: No analytics or user tracking

### API Security

- **Environment Variables**: API keys stored securely
- **No Hardcoding**: All sensitive data in environment variables
- **HTTPS Only**: Secure API communication

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style and conventions
- Add TypeScript types for new features
- Update documentation for significant changes
- Test your changes thoroughly
- Ensure ESLint passes

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

### Technologies & Services

- **Anthropic** - Claude 3.5 Sonnet AI model
- **OpenAI** - GPT-4o Mini AI model
- **OpenRouter** - Unified AI model API access
- **Shadcn/ui** - Beautiful and accessible UI components
- **Vite** - Lightning-fast build tool
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework

### Libraries

- **PDF.js** - PDF text extraction
- **Mammoth.js** - DOCX file processing
- **React Markdown** - Markdown rendering
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

---

## 📞 Contact & Support

- **Project Maintainer**: Niraj Mehta
- **Email**: nirajmehta960@gmail.com
- **GitHub**: [@nirajmehta960](https://github.com/nirajmehta960)
- **Live Demo**: [meeting-mind-ai.vercel.app](https://meeting-mind-ai.vercel.app)

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/nirajmehta960/meeting-mind-ai/issues)
- **Discussions**: Join community discussions for questions and ideas

---

## 🗺 Roadmap

### Planned Features

- [ ] Export conversations to PDF/Word
- [ ] Team collaboration features
- [ ] Integration with calendar apps
- [ ] Advanced analytics dashboard
- [ ] Custom AI prompt templates
- [ ] Multi-language support
- [ ] Audio file transcription
- [ ] Meeting recording integration

### Known Limitations

- File processing happens client-side (browser memory limits)
- No cloud storage (local storage only)
- No real-time collaboration
- Limited to English language analysis

---

<div align="center">

**Built with ❤️ for professionals who value their time**

_Transform your meetings into actionable insights with AI-powered analysis_

[⭐ Star this repo](https://github.com/nirajmehta960/meeting-mind-ai) if you find it helpful!

</div>
