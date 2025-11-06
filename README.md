# Azure vs Databricks Advisor

An AI-powered chat-based web agent that helps technical teams make informed decisions between Azure/Microsoft stack and Databricks for their data and analytics needs.

## Features

- **AI-Powered Guidance**: Uses OpenAI's GPT models to provide intelligent, context-aware comparisons
- **Comprehensive Coverage**: Compares platforms across:
  - Cost & Pricing Models
  - Technical Capabilities (Data Processing, ML/AI)
  - Integration & Ecosystem
  - Scalability & Performance
  - Security & Governance
- **Interactive Chat Interface**: Modern, responsive UI with conversation history
- **Context-Aware**: Maintains conversation context for follow-up questions
- **Technical Focus**: Tailored for mixed audiences with emphasis on technical decision-makers

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

## Installation

1. Clone or navigate to this directory:
```bash
cd azure-databricks-advisor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to the `.env` file:
```
OPENAI_API_KEY=your_actual_api_key_here
```

You can get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Usage

1. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Start chatting with the advisor!

## Configuration

### Environment Variables

- `OPENAI_API_KEY` (required): Your OpenAI API key
- `OPENAI_MODEL` (optional): Model to use (default: `gpt-4-turbo-preview`)
  - Options: `gpt-4-turbo-preview`, `gpt-4`, `gpt-3.5-turbo`
- `PORT` (optional): Server port (default: `3000`)

### Using Different AI Providers

The application currently uses OpenAI's API. To use Azure OpenAI or other providers:

1. Install the appropriate SDK
2. Modify the client initialization in [server.js](server.js)
3. Update the API call in the `/api/chat` endpoint

Example for Azure OpenAI:
```javascript
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
);
```

## API Endpoints

### POST `/api/chat`
Send a message and receive a response.

**Request:**
```json
{
  "message": "What are the cost differences?",
  "conversationId": "conv_123_abc" // optional
}
```

**Response:**
```json
{
  "message": "AI response here...",
  "conversationId": "conv_123_abc"
}
```

### POST `/api/reset`
Reset a conversation.

**Request:**
```json
{
  "conversationId": "conv_123_abc"
}
```

### GET `/api/health`
Health check endpoint.

## Project Structure

```
azure-databricks-advisor/
├── public/
│   ├── index.html      # Chat interface
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── server.js           # Express server & AI integration
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Example Questions

- "What are the main cost differences between Azure Synapse and Databricks?"
- "We're a Microsoft shop using Power BI heavily. Should we still consider Databricks?"
- "What are the pros and cons of each for machine learning workloads?"
- "Can we use both Azure and Databricks together? What would that look like?"
- "Our team has 5 data engineers and 3 data scientists. Which platform would be easier to adopt?"

## Customization

### Modifying the AI System Prompt

Edit the `SYSTEM_PROMPT` constant in [server.js](server.js:25) to change how the AI advisor behaves and what knowledge it emphasizes.

### Styling

Customize the look and feel by editing [public/styles.css](public/styles.css).

### Adding Features

Some ideas for enhancement:
- User authentication
- Persistent storage (database)
- Export chat history
- Multi-language support
- Integration with company-specific data
- Cost calculator tools
- Architecture diagram generator

## Production Deployment

For production deployment:

1. Use a proper database (PostgreSQL, MongoDB) instead of in-memory storage
2. Add rate limiting and security middleware
3. Implement authentication if needed
4. Use environment-specific configurations
5. Set up monitoring and logging
6. Consider using a managed service (Heroku, AWS, Azure, etc.)

Example with additional security:
```bash
npm install helmet express-rate-limit
```

## Troubleshooting

**Error: Missing API key**
- Ensure your `.env` file exists and contains a valid `OPENAI_API_KEY`

**Error: Cannot connect to server**
- Check that the server is running on the correct port
- Verify no firewall is blocking the connection

**Slow responses**
- GPT-4 models can take 10-30 seconds for complex responses
- Consider using `gpt-3.5-turbo` for faster responses
- Check your OpenAI API rate limits

## License

MIT

## Support

For issues or questions, please open an issue in the project repository.
