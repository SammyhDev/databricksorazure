# Azure vs Databricks Advisor

An AI-powered chat-based web agent that helps technical teams make informed decisions between Azure/Microsoft stack and Databricks for their data and analytics needs.

## Deploy to Azure

Deploy this application to Azure with one click:

### Option 1: Azure App Service (Recommended for most users)

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FSammyhDev%2Fdatabricksorazure%2Fmain%2Fazuredeploy.json)

**Best for**: Quick deployment, automatic scaling, easy management

### Option 2: Azure Container Apps (Advanced)

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FSammyhDev%2Fdatabricksorazure%2Fmain%2Fazuredeploy-containerapp.json)

**Best for**: Microservices, container-based workflows, advanced scaling

### What you'll need for deployment:
- An Azure subscription ([create one free](https://azure.microsoft.com/free/))
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

The deployment wizard will prompt you for:
- **OpenAI API Key**: Your OpenAI API key (securely stored)
- **OpenAI Model**: Choose between GPT-4, GPT-3.5-turbo, etc.
- **App Name**: A unique name for your application
- **Pricing Tier**: Select based on your needs (Free tier available for App Service)

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

## Azure Deployment Details

### Azure App Service Deployment

The ARM template automatically configures:
- Node.js 18 LTS runtime
- HTTPS-only access
- Automatic deployment from GitHub
- Environment variables for OpenAI API
- App Service Plan with your selected tier

**Pricing Tiers**:
- **F1 (Free)**: Good for testing, limited resources
- **B1 (Basic)**: Recommended for production, $13/month
- **S1 (Standard)**: Better performance and features, $70/month

### Azure Container Apps Deployment

The ARM template includes:
- Container environment with Log Analytics
- Auto-scaling (1-3 replicas)
- HTTPS ingress configuration
- Secure secret management for API keys
- Resource allocation (0.5 CPU, 1GB RAM per container)

### Manual Azure Deployment

If you prefer manual deployment:

#### Using Azure CLI:
```bash
# Login to Azure
az login

# Create resource group
az group create --name azure-databricks-advisor-rg --location eastus

# Deploy using ARM template
az deployment group create \
  --resource-group azure-databricks-advisor-rg \
  --template-file azuredeploy.json \
  --parameters openaiApiKey="your-api-key"
```

#### Using Docker:
```bash
# Build the Docker image
docker build -t azure-databricks-advisor .

# Run locally
docker run -p 8080:8080 \
  -e OPENAI_API_KEY="your-api-key" \
  -e OPENAI_MODEL="gpt-4-turbo-preview" \
  azure-databricks-advisor

# Push to Azure Container Registry
az acr build --registry yourregistry \
  --image azure-databricks-advisor:latest .
```

## Production Best Practices

For production deployments:

1. Use a proper database (PostgreSQL, MongoDB) instead of in-memory storage
2. Add rate limiting and security middleware
3. Implement authentication if needed
4. Use environment-specific configurations
5. Set up monitoring and logging with Application Insights
6. Enable Azure Key Vault for secret management

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
