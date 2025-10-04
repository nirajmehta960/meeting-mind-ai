# MeetingMind

Transform meeting chaos into actionable insights. Get instant summaries, extract action items, and generate stakeholder emails with AI precision.

## Features

- **AI-Powered Meeting Summaries**: Get comprehensive meeting summaries with key insights and decisions
- **Action Item Extraction**: Automatically identify and organize actionable tasks with owners and deadlines
- **Stakeholder Email Generation**: Draft professional stakeholder communications and follow-up emails
- **Dual AI Models**: Choose between Claude 4.0 Sonnet and Gemini 2.5 Flash for optimal responses
- **File Upload Support**: Upload meeting transcripts, notes, and documents for analysis
- **Real-time Streaming**: Watch AI responses generate in real-time for better interaction
- **Voice Input**: Speak your questions using speech-to-text functionality

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for Claude (via DeepInfra) and Gemini

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/meetingmind.git
cd meetingmind
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Add your API keys to `.env`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_DEEPINFRA_API_KEY=your_deepinfra_api_key_here
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the application.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Tailwind CSS, shadcn/ui
- **AI Integration**: Claude 4.0 Sonnet, Gemini 2.5 Flash
- **Markdown Rendering**: React Markdown with GitHub Flavored Markdown
- **Icons**: Lucide React
- **State Management**: React Hooks

## API Keys Setup

### Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### Claude API Key (via DeepInfra)

1. Sign up at [DeepInfra](https://deepinfra.com/)
2. Get your API key from the dashboard
3. Add it to your `.env` file as `VITE_DEEPINFRA_API_KEY`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@meetingmind.ai or join our Discord community.
